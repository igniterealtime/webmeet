(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    const ERROR = [" ", "Unable to reveal attributes", "Owner not available or may have refused"];
    const PREFIX = "Disclosure for";

    let _converse = null;
    let irmaDisclosures = {};

    window.addEventListener("load", function()
    {
        loadJS('widget/irma/vendors~jwt.js');
        loadJS('widget/irma/irma.js');
    });

    converse.plugins.add("irma", {
        dependencies: [],

        initialize: function () {
            _converse = this._converse;

            _converse.api.waitUntil('chatBoxesInitialized').then(() => _converse.chatboxes.on('add', chatbox =>
            {
                if (chatbox.get('type') === _converse.CHATROOMS_TYPE)
                {
                    chatbox.occupants.on('add', occupant =>
                    {
                        const disclosures = irmaDisclosures[occupant.get("jid")];
                        if (disclosures) attachBadge(occupant, disclosures, true);
                    });
                }
            }));

            _converse.api.listen.on('connected', function()
            {
                getIrmaStatus(function(supported)
                {
                    console.debug("irma discover", supported);
                    if (supported) listenForIrma();
                });
            });

            console.log("irma plugin is ready");
        },

        overrides: {
            ChatBoxView: {

                parseMessageForCommands: function(text)
                {
                    console.debug('irma - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();
                    const view = this;
                    let occupant = null;

                    if (command === "reveal" || command === "disclose")
                    {
                        let jid = view.model.get("jid");

                        if (this.model.get("type") == "chatroom")
                        {
                            if (!match[2])
                            {
                                this.showHelpMessages(["Nickname required"]);
                                return true;
                            }

                            occupant = view.model.occupants.findWhere({'nick': match[2]});

                            if (!occupant)
                            {
                                this.showHelpMessages(["Unable to request from " + match[2]]);
                                return true;
                            }

                            jid = occupant.get('jid');
                        }

                        startIrmaDisclosure(this, match[2].trim(), jid, occupant);
                        return true;
                    }
                }
            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    await this.__super__.renderChatMessage.apply(this, arguments);

                    var messageDiv = this.el.querySelector('.chat-msg__author');

                    if (messageDiv)
                    {
                        const source = this.model.get("type") == "groupchat" ? converse.env.Strophe.getResourceFromJid(this.model.get("from")) : this.model.get("jid");
                        const disclosures = irmaDisclosures[source];

                        //console.debug("renderChatMessage", source, disclosures, irmaDisclosures);

                        if (disclosures)
                        {
                            const bsn = disclosures['irma-demo.MijnOverheid.root.BSN'];
                            const html = '<img title="BSN=' + bsn + '" src="widget/irma/check-solid.svg" width="16"/>';

                            messageDiv.insertAdjacentElement('afterEnd', newElement('span', null, html));
                        }
                    }
                }
            }
        }
    });

    function getIrmaStatus(callback)
    {
        const iq = converse.env.$iq({type: 'get', to: _converse.domain}).c('disclose', {xmlns: 'http://bloqzone.nl/irma'});

        _converse.connection.sendIQ(iq, function(resp)
        {
            callback(false);    // not supposed to happen

        }, function(err) {
            const errorCode = err.querySelector('error').getAttribute("code");
            console.debug("getIrmaStatus", errorCode);
            callback(errorCode == '400');
        });
    }

    function listenForIrma()
    {
        console.debug("listenForIrma");
        var qrcodeDialog = null;

        var QRCodeDialog = _converse.BootstrapModal.extend(
        {
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                this.model.on('change', this.render, this);
            },

            toHTML() {
              var title = this.model.get("title");
              return '<div class="modal" id="myModal"> <div class="modal-dialog"> <div class="modal-content">' +
                     '<div class="modal-header"><h1 class="modal-title">' + title + '</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                     '<div class="modal-body"></div>' +
                     '<div class="modal-status">Please scan the QR code with your IRMA app</div>' +
                     '<div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button></div>' +
                     '</div> </div> </div>';
            },

            afterRender() {
                var that = this;
                var qrcode = this.model.get("qrcode");

                this.el.addEventListener('shown.bs.modal', function()
                {
                    if (qrcode)
                    {
                        that.el.querySelector('.modal-body').innerHTML = '<img src="' + qrcode + '" />';
                    }

                }, false);
            },

            events: {
                "click .btn-danger": "clearQRCode",
            },

            clearQRCode() {
                var callback = this.model.get("callback");
                var token = this.model.get("token");
                var url = this.model.get("url");
                if (callback && token) callback(token, url);
            },

            startSession() {
                this.el.querySelector('.modal-status').innerHTML = "Please follow the instructions in your IRMA app";
            },

            endSession() {
               this.modal.hide();
            }
        });

        var userCancelled = function(token, baseUrl)
        {
            const url = baseUrl + "/session/" + token;

            fetch(url, {method: "DELETE"}).then(function(response){ return response.text()}).then(function(response)
            {
                console.debug('irma/cancel ok', response);

            }).catch(function (err) {
                console.debug('irma/cancel error', err);
            });
        }

        _converse.connection.addHandler(function(iq)
        {
            console.debug('irma handler', iq);
            const sessionPtr = iq.querySelector('sessionPtr');

            if (sessionPtr)
            {
                const u = sessionPtr.getAttribute("u");
                const url = u.split("/");
                const baseUrl = url[0] + "//" + url[2] + "/" + url[3]
                const token = sessionPtr.getAttribute("token");
                const irmaqr = sessionPtr.getAttribute("irmaqr");

                console.debug("irma/disclose", url, token, baseUrl, irmaqr);

                irma.handleSession({u: u, irmaqr: irmaqr}, {server: baseUrl, token: token, method: 'url'}).then(result =>
                {
                    console.debug("irma.handleSession", result);

                    qrcodeDialog = new QRCodeDialog({'model': new converse.env.Backbone.Model({title: 'IRMA Verification', callback: userCancelled, qrcode: result, token: token, url: baseUrl}) });
                    qrcodeDialog.show();
                });
            }
            return true;

        }, "http://bloqzone.nl/irma", 'iq');
    }

    function startIrmaDisclosure(view, nick, target, occupant)
    {
        console.debug("startIrmaDisclosure", target, nick, occupant);
        let disclosures = {};
        let label = target;
        if (nick) label = nick + " (" + target + ")";

        const iq = converse.env.$iq({type: 'get', to: _converse.domain}).c('disclose', {xmlns: 'http://bloqzone.nl/irma', target: target});

        view.showHelpMessages(['', PREFIX + ' ' + label]);

        _converse.connection.sendIQ(iq, function(resp)
        {
            console.debug("startIrmaDisclosure response", resp);
            const attributes = resp.querySelectorAll('attribute');

            for (var i=0; i<attributes.length; i++)
            {
                const name = attributes[i].querySelector('name').innerHTML;
                const value = attributes[i].querySelector('value').innerHTML;
                disclosures[name] = value;
            }

            console.debug("startIrmaDisclosure attribute", disclosures);
            view.showHelpMessages(['BSN = ' + disclosures['irma-demo.MijnOverheid.root.BSN']]);
            if (occupant) attachBadge(occupant, disclosures, true);

            irmaDisclosures[target] = disclosures;
            irmaDisclosures[nick] = disclosures;

        }, function(err) {
            const errorCode = err.querySelector('error').getAttribute("code");
            console.debug("getIrmaStatus", errorCode, err);
            view.showHelpMessages(ERROR);
            if (occupant) attachBadge(occupant, disclosures, false);
        });
    }

    function loadJS(name)
    {
        var s1 = document.createElement('script');
        s1.src = name;
        s1.async = false;
        document.body.appendChild(s1);
    }

    function loadCSS(name)
    {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = name;
        head.appendChild(link);
    }

    function newElement(el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function attachBadge(occupant, disclosures, flag)
    {
        const element = document.getElementById(occupant.get('id'));
        const badges = element.querySelector(".occupant-badges");
        const img = flag ? "check-solid.svg" : "times-solid.svg";
        const bsn = disclosures['irma-demo.MijnOverheid.root.BSN'] ? disclosures['irma-demo.MijnOverheid.root.BSN'] : "unknown";
        const html = '<img title="BSN=' + bsn + '" src="widget/irma/' + img + '" width="16"/>';
        const irmaEle = element.querySelector(".occupants-irma");

        if (irmaEle)
        {
            irmaEle.innerHTML = html;
        }
        else {
            badges.insertAdjacentElement('afterEnd', newElement('span', null, html, 'occupants-irma'));
        }
    }

}));
