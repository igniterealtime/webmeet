var of = {}

window.addEventListener("load", function()
{
    window.localStorage["webmeet_record"]       =  config.webmeet_record;
    window.localStorage["webmeet_record_audio"] =  config.webmeet_record_audio;
    window.localStorage["webmeet_record_video"] =  config.webmeet_record_video;
    window.localStorage["webmeet_transcription"] = config.webmeet_transcription;
    window.localStorage["webmeet_captions"]     =  config.webmeet_captions;

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
                        console.log("account", result, error);

                        if (error) {
                            console.error('Account error', error);
                            document.getElementById("loader").style.display = "none";
                            converse.initialize(config);

                        } else {
                            account = result[0];

                            window.localStorage["uport.account"] =  account;

                            console.log('Account:' + account);

                            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
                            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar, password: "", account: account})};

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

function stopRecorder()
{
    console.log("stopRecorder");

    if (of.audioRecorder) of.audioRecorder.stop();
    if (of.videoRecorder) of.videoRecorder.stop();
}

function startRecorder(recordAudio, recordVideo, localAudioStream, localVideoStream, room, nickname, username, password)
{
    console.log("startRecorder", nickname, room, username, localAudioStream, localVideoStream);

    if (recordAudio || recordVideo)
    {
        of.audioRecorder = new MediaRecorder(localAudioStream);
        of.audioChunks = [];

        of.audioRecorder.ondataavailable = function(e)
        {
            if (e.data.size > 0)
            {
                console.log("startRecorder push audio ", e.data);
                of.audioChunks.push(e.data);
            }
        }

        of.audioRecorder.onstop = function(e)
        {
            console.log("audioRecorder.onstop ", e.data);
            var audioReader = new FileReader();

            audioReader.onload = function()
            {
                var file = dataUrlToFile(audioReader.result, room + "." + nickname + ".audio.webm");
                console.log("audioReader.onload", file);
                uploadFile(file, room, username, password);
            };

            audioReader.readAsDataURL(new Blob(of.audioChunks, {type: 'video/webm'}));
        }

        of.audioRecorder.start();
    }

    if (recordVideo)
    {
        of.videoRecorder = new MediaRecorder(localVideoStream);
        of.videoChunks = [];

        of.videoRecorder.ondataavailable = function(e)
        {
            if (e.data.size > 0)
            {
                console.log("startRecorder push video ", e.data);
                of.videoChunks.push(e.data);
            }
        }

        of.videoRecorder.onstop = function(e)
        {
            console.log("videoRecorder.onstop ", e.data);
            var videoReader = new FileReader();

            videoReader.onload = function()
            {
                var file = dataUrlToFile(videoReader.result, room + "." + nickname + ".video.webm");
                console.log("videoReader.onload", file);
                uploadFile(file, room, username, password);
            };

            videoReader.readAsDataURL(new Blob(of.videoChunks, {type: 'video/webm'}));
        }

        of.videoRecorder.start();
    }
}

function uploadFile(file, room, username, password)
{
    console.log("uploadFile", file, room);

    var server = config.bosh_service_url.split("/")[2];

    var putUrl = "https://" + server + "/dashboard/upload?name=" + file.name + "&username=" + username;

    var req = new XMLHttpRequest();

    req.onreadystatechange = function()
    {
      if (this.readyState == 4 && this.status >= 200 && this.status < 400)
      {
        console.log("uploadFile", this.statusText);
      }
      else

      if (this.readyState == 4 && this.status >= 400)
      {
        console.error("uploadFile", this.statusText);
      }

    };
    req.open("PUT", putUrl, true);
    req.setRequestHeader("Authorization", 'Basic ' + btoa(username + ':' + password));
    req.send(file);
}

function dataUrlToFile(dataUrl, name)
{
    //console.log("dataUrlToFile", dataUrl, name);

    var binary = atob(dataUrl.split(',')[1]),
    data = [];

    for (var i = 0; i < binary.length; i++)
    {
        data.push(binary.charCodeAt(i));
    }

    return new File([new Uint8Array(data)], name, {type: 'video/webm'});
}


