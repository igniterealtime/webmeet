(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a module called "ofmeet"
        define(["converse"], factory);
    } else {
        // Browser globals. If you're not using a module loader such as require.js,
        // then this line below executes. Make sure that your plugin's <script> tag
        // appears after the one from converse.js.
        factory(converse);
    }
}(this, function (converse) {

    // Commonly used utilities and variables can be found under the "env"
    // namespace of the "converse" global.
    var Strophe = converse.env.Strophe,
        $iq = converse.env.$iq,
        $msg = converse.env.$msg,
        $pres = converse.env.$pres,
        $build = converse.env.$build,
        b64_sha1 = converse.env.b64_sha1,
        _ = converse.env._,
        moment = converse.env.moment;

     var _converse = null;
     var ofmeetReady = false;
     var messageCount = 0;

    // The following line registers your plugin.
    converse.plugins.add("ofmeet", {

        /* Optional dependencies are other plugins which might be
           * overridden or relied upon, and therefore need to be loaded before
           * this plugin. They are called "optional" because they might not be
           * available, in which case any overrides applicable to them will be
           * ignored.
           *
           * NB: These plugins need to have already been loaded via require.js.
           *
           * It's possible to make optional dependencies non-optional.
           * If the setting "strict_plugin_dependencies" is set to true,
           * an error will be raised if the plugin is not found.
           */
        'dependencies': [],

        /* Converse.js's plugin mechanism will call the initialize
         * method on any plugin (if it exists) as soon as the plugin has
         * been loaded.
         */
        'initialize': function () {
            /* Inside this method, you have access to the private
             * `_converse` object.
             */
            _converse = this._converse;
            _converse.log("The \"ofmeet\" plugin is being initialized");

            /* From the `_converse` object you can get any configuration
             * options that the user might have passed in via
             * `converse.initialize`.
             *
             * You can also specify new configuration settings for this
             * plugin, or override the default values of existing
             * configuration settings. This is done like so:
            */
            _converse.api.settings.update({

            });

            _converse.api.settings.update({
                'initialize_message': 'Initializing ofmeet',
                'visible_toolbar_buttons': {
                    'emoji': true,
                    'call': true,
                    'clear': true
                },
                hide_open_bookmarks: true,
                ofswitch: false,
                ofmeet_invitation: 'Please join meeting at:'
            });

            /* The user can then pass in values for the configuration
             * settings when `converse.initialize` gets called.
             * For example:
             *
             *      converse.initialize({
             *           "initialize_message": "My plugin has been initialized"
             *      });
             */
            console.log(this._converse.initialize_message);

            /* Besides `_converse.api.settings.update`, there is also a
             * `_converse.api.promises.add` method, which allows you to
             * add new promises that your plugin is obligated to fulfill.
             *
             * This method takes a string or a list of strings which
             * represent the promise names:
             *
             *      _converse.api.promises.add('myPromise');
             *
             * Your plugin should then, when appropriate, resolve the
             * promise by calling `_converse.api.emit`, which will also
             * emit an event with the same name as the promise.
             * For example:
             *
             *      _converse.api.emit('operationCompleted');
             *
             * Other plugins can then either listen for the event
             * `operationCompleted` like so:
             *
             *      _converse.api.listen.on('operationCompleted', function { ... });
             *
             * or they can wait for the promise to be fulfilled like so:
             *
             *      _converse.api.waitUntil('operationCompleted', function { ... });
             */
        },

        /* If you want to override some function or a Backbone model or
         * view defined elsewhere in converse.js, then you do that under
         * the "overrides" namespace.
         */
        'overrides': {
            /* For example, the private *_converse* object has a
             * method "onConnected". You can override that method as follows:
             */
            'onConnected': function () {
                // Overrides the onConnected method in converse.js

                // Top-level functions in "overrides" are bound to the
                // inner "_converse" object.
                var _converse = this;

                // Your custom code can come here ...

                var initOpenfire = function initOpenfire()
                {

                }

                Promise.all([_converse.api.waitUntil('rosterContactsFetched'), _converse.api.waitUntil('chatBoxesFetched'), _converse.api.waitUntil('roomsPanelRendered')]).then(initOpenfire);


                // You can access the original function being overridden
                // via the __super__ attribute.
                // Make sure to pass on the arguments supplied to this
                // function and also to apply the proper "this" object.
                _converse.__super__.onConnected.apply(this, arguments);

                // Your custom code can come here ...
            },

            ChatBoxView: {

                toggleCall: function toggleCall(ev) {
                    ev.stopPropagation();

                    var url = "../verto";

                    if (_converse.api.settings.get("ofswitch") == false)
                    {
                        var room = Strophe.getNodeFromJid(this.model.attributes.jid) + Math.random().toString(36).substr(2,9);
                        url = "https://" + _converse.api.settings.get("bosh_service_url").split("/")[2] + "/ofmeet/" + room;
                        this.onMessageSubmitted(_converse.api.settings.get("ofmeet_invitation") + ' ' + url);
                    }

                    window.open(url, location.href);
                },

                renderMessage: function renderMessage(attrs) {
                    //console.log("render", attrs, this.model);

                    var id = this.model.attributes.id;
                    var text = attrs.fullname + " says " + attrs.message;
                    var room = this.model.attributes.jid + "<br/>" + this.model.attributes.description;

                    var notifyMe = function()
                    {
                        _converse.playSoundNotification();

                        if (Notification.permission !== "granted")
                            Notification.requestPermission();
                        else {
                            var notification = new Notification(room, {
                              icon: 'image.png',
                              body: text,
                            });

                            notification.onclick = function () {
                              window.parent.document.body.focus();
                            };
                        }
                    }

                    if (!document.hasFocus())
                    {
                        // converse is handling this!!
                        //notifyMe();
                        window.parent.ofmeet.doBadge(++messageCount);
                    } else {
                        messageCount = 0;
                    }

                    return this.__super__.renderMessage.apply(this, arguments);
                },

                renderToolbar: function renderToolbar(toolbar, options) {
                    //console.log('ofmeet - renderToolbar', this.model);

                    this.model.set({'hidden_occupants': true});

                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    var dropZone = $(this.el).find('.chat-body')[0];
                    dropZone.removeEventListener('dragover', handleDragOver);
                    dropZone.removeEventListener('drop', handleDropFileSelect);
                    dropZone.addEventListener('dragover', handleDragOver, false);
                    dropZone.addEventListener('drop', handleDropFileSelect, false);

                    var id = this.model.get("box_id");

                    var html = '<li title="Upload"><label class="custom-file-upload"><input id="file-' + id + '" type="file" name="files[]" multiple /><i class="icon-attachment"></i></label></li>';
                    $(this.el).find('.toggle-call').after(html);

                    var id = this.model.get("box_id");
                    var html = '<li id="ofmeet-exit-webchat-' + id + '"><a class="icon-exit" title="Exit Web Chat"></a></li>';
                    $(this.el).find('.toggle-occupants').after(html);

                    setTimeout(function()
                    {
                        var fileButton = document.getElementById("file-" + id);
                        fileButton.addEventListener('change', doUpload, false);

                        var exitButton = document.getElementById("ofmeet-exit-webchat-" + id);
                        exitButton.addEventListener('click', doExit, false);

                    });

                    return result;
                }
            },

            /* Override converse.js's XMPPStatus Backbone model so that we can override the
             * function that sends out the presence stanza.
             */
            'XMPPStatus': {
                'sendPresence': function (type, status_message, jid) {
                    // The "_converse" object is available via the __super__
                    // attribute.
                    var _converse = this.__super__._converse;

                    // Custom code can come here ...

                    // You can call the original overridden method, by
                    // accessing it via the __super__ attribute.
                    // When calling it, you need to apply the proper
                    // context as reference by the "this" variable.
                    this.__super__.sendPresence.apply(this, arguments);

                    // Custom code can come here ...
                }
            }
        }
    });

    var doExit = function doExit(event)
    {
        console.log("doExit", event);
        window.parent.ofmeet.doExit();
        messageCount = 0;
    }

    var postMessage = function postMessage(message)
    {
        _converse.chatboxviews.each(function (view)
        {
            var chatType = view.model.get('type');

            if ((chatType === "chatroom" || chatType === "chatbox") && !view.model.get('hidden'))
            {
                console.log("postMessage", view.model.get('id'));
                view.onMessageSubmitted(message);
            }
        });
    }

    var doUpload = function doUpload(event)
    {
        console.log("doUpload", event);

        _converse.chatboxviews.each(function (view)
        {
            var chatType = view.model.get('type');

            if ((chatType === "chatroom" || chatType === "chatbox") && !view.model.get('hidden'))
            {
                console.log("ofmeet-upload", view.model.get('id'));

                var files = event.target.files;

                for (var i = 0, f; f = files[i]; i++)
                {
                    uploadFile(f, view);
                }
                done = true;
            }
        });
    }

    var handleDragOver = function handleDragOver(evt)
    {
        //console.log("handleDragOver");

        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    };

    var handleDropFileSelect = function handleDropFileSelect(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();

        _converse.chatboxviews.each(function (view)
        {
            console.log("handleDropFileSelect", view.model.get('type'));

            if ((view.model.get('type') === "chatroom" || view.model.get('type') === "chatbox") && !view.model.get('hidden'))
            {
                var files = evt.dataTransfer.files;

                for (var i = 0, f; f = files[i]; i++)
                {
                    uploadFile(f, view);
                }
            }
        });
    };

    var uploadFile = function uploadFile(file, view)
    {
        console.log("uploadFile", file, _converse.connection.domain);

        var iq = $iq({type: 'get', to: "httpfileupload." + _converse.connection.domain}).c('request', {xmlns: "urn:xmpp:http:upload"}).c('filename').t(file.name).up().c('size').t(file.size);
        var getUrl = null;
        var putUrl = null;
        var errorText = null;

        _converse.connection.sendIQ(iq, function(response)
        {
            $(response).find('slot').each(function()
            {
                $(response).find('put').each(function()
                {
                    putUrl = $(this).text();
                });

                $(response).find('get').each(function()
                {
                    getUrl = $(this).text();
                });

                console.log("ofmeet.uploadFile", putUrl, getUrl);

                if (putUrl != null & getUrl != null)
                {
                    var req = new XMLHttpRequest();

                    req.onreadystatechange = function()
                    {
                      if (this.readyState == 4 && this.status >= 200 && this.status < 400)
                      {
                        console.log("ofmeet.upload.ok", this.statusText, getUrl);
                        view.onMessageSubmitted(getUrl);
                      }
                      else

                      if (this.readyState == 4 && this.status >= 400)
                      {
                        console.error("ofmeet.upload.error", this.statusText);
                        view.onMessageSubmitted(this.statusText);
                      }

                    };
                    req.open("PUT", putUrl, true);
                    req.send(file);
                }
            });

        }, function(error) {

            $(error).find('text').each(function()
            {
                errorText = $(this).text();
                console.log("ofmeet.upload.uploadFile error", errorText);
                view.onMessageSubmitted(errorText);
            });
        });
    };
}));