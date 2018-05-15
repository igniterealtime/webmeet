window.addEventListener("load", function()
{
    if (config.uport)
    {
        var clientId = "2p1psGHt9J5NBdPDQejSVhpsECXLxLaVQSo";
        var permission = "Wa1l7M9NoGwcxxdX";
        var server = config.bosh_service_url.split("/")[2];
        var avatar = null;

        var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/pade/" + clientId;
        var options = {method: "GET", headers: {"authorization": permission}};

        fetch(url, options).then(function(response){ return response.text()}).then(function(signer)
        {
            //console.log("Signer", signer);

            window.uport = new uportconnect.Connect("Pade", {clientId: clientId, signer: uportconnect.SimpleSigner(signer)});

            window.uport.requestCredentials({notifications: true, verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) => 
            {
                //console.log("Credentials", credentials);

                document.getElementById("loader").style.display = "inline";

                config.uport_data = {name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, avatar: credentials.avatar ? credentials.avatar.uri : null};

                if (config.auto_join_rooms && config.auto_join_rooms[0])
                {
                    config.auto_join_rooms[0] = {jid: config.auto_join_rooms[0], nick: credentials.name};
                }
                
                window.localStorage["uport.address"] =  credentials.address;
                window.localStorage["uport.email"] =    credentials.email;
                window.localStorage["uport.phone"] =    credentials.phone;
                window.localStorage["uport.country"] =  credentials.country;
                window.localStorage["uport.name"]    =  credentials.name;      
                
                if (credentials.avatar && credentials.avatar.uri)
                {
                    avatar = credentials.avatar.uri;
                    window.localStorage["uport.avatar"] = avatar;
                }                

                if (credentials.registration && credentials.registration.xmpp)
                {
                    if (credentials.registration.xmpp.indexOf("@" + config.locked_domain) > -1)
                    {
                        //console.log("login existing user", credentials.registration);

                        config.authentication = "login";
                        config.jid = credentials.registration.xmpp;
                        config.password = credentials.registration.access;
                        
                        // for jitsi meet
                        
                        localStorage.setItem("xmpp_username_override", credentials.registration.xmpp);
                        localStorage.setItem("xmpp_password_override", credentials.registration.access);                        

                        document.getElementById("loader").style.display = "none";
                        converse.initialize(config);
                        
                    } else {
                        console.error("uPort credentials are not for server " + server + ", found " + credentials.registration.xmpp); 
                        document.getElementById("loader").style.display = "none";
                        converse.initialize(config);                        
                    }
                    

                } else {

                    var web3 = window.uport.getWeb3();
                    var account = null;

                    web3.eth.getAccounts((error, result) =>
                    {
                        console.log("account", account, error);

                        if (error) {
                            console.error('Account error', error);
                            document.getElementById("loader").style.display = "none";
                            converse.initialize(config);     

                        } else {
                            account = result[0];
                            
                            window.localStorage["uport.account"] =  account;  
                                            
                            console.log('Account:' + account);                

                            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
                            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: avatar, password: "", account: account})};

                            //console.log("register new user", credentials);

                            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
                            {
                                try {
                                    userpass = JSON.parse(userpass);

                                    //console.log('uport register ok', userpass);

                                    window.uport.attestCredentials({
                                        sub: credentials.address,
                                        claim: {registration: {username: userpass.username, access: userpass.password, xmpp: userpass.username + "@" + config.locked_domain}},
                                        exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000

                                    }).then((result) => {
                                        console.log('attestCredentials result', result);

                                        config.authentication = "login";
                                        config.jid = userpass.username + "@" + config.locked_domain;
                                        config.password = userpass.password;
                                        
                                        // for jitsi meet

                                        localStorage.setItem("xmpp_username_override", userpass.username + "@" + config.locked_domain);
                                        localStorage.setItem("xmpp_password_override", userpass.password);                        
                                        
                                        document.getElementById("loader").style.display = "none";
                                        converse.initialize(config);

                                    }).catch(function (err) {
                                        console.error('attestCredentials error', err);
                                        document.getElementById("loader").style.display = "none";
                                        converse.initialize(config);
                                    });

                                } catch (e) {
                                    console.error('Credentials error', e);
                                    document.getElementById("loader").style.display = "none";
                                    converse.initialize(config);
                                }

                            }).catch(function (err) {
                                console.error('Credentials error', err);
                                document.getElementById("loader").style.display = "none";
                                converse.initialize(config);
                            });
                        }
                    });
                }

            }, function(err) {
                console.error("Credentials", err);
                document.getElementById("loader").style.display = "none";
                converse.initialize(config);
            });

        }).catch(function (err) {
            console.error('uPort permission error', err);
            document.getElementById("loader").style.display = "none";
            converse.initialize(config);
        });

    } else {
        document.getElementById("loader").style.display = "none";
        converse.initialize(config);
    }
});
