/**
 * ofmeet.js
 */

var ofmeet = (function(of)
{
    var room = urlParam("room");

    var recordAudio = JSON.parse(window.localStorage["webmeet_record_audio"]);
    var recordVideo = JSON.parse(window.localStorage["webmeet_record_video"]);
    var enableTranscription = JSON.parse(window.localStorage["webmeet_transcription"]);
    var enableCaptions = JSON.parse(window.localStorage["webmeet_captions"]);
    var enableRecord = JSON.parse(window.localStorage["webmeet_record"]);

    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    };

    function setup()
    {
        if (!APP.connection)
        {
            setTimeout(function() {setup();}, 1000);
            return;
        }

        console.log("ofmeet.js setup");

        __init();

        this.connection = APP.connection.xmpp.connection;
        of.connection = connection;

        of.connection.addHandler(function(message)
        {
            console.log("ofmeet.js incoming xmpp", message);

            $(message).find('ofmeet').each(function ()
            {
                try {


                } catch (e) {}
            });

            return true;

        }, "jabber:x:ofmeet", 'message');

        APP.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, function()
        {
            console.error("Connection Failed!", name)
        });

        APP.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, function()
        {
            console.log("Connection Disconnected!")
        });
    }

    function __init()
    {
        console.log("ofmeet.js __init");

        of.username = localStorage.getItem("xmpp_username_override").split("@")[0];
        of.password = localStorage.getItem("xmpp_password_override");

        of.subtitles = document.getElementById("subtitles");

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function()
        {
            console.log("ofmeet.js me joined");
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function()
        {
            console.log("ofmeet.js me left");

            if (of.recognition)
            {
                of.recognitionActive = false;
                of.recognition.stop();
            }

            if (parent && parent.stopRecorder) parent.stopRecorder();
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.MESSAGE_RECEIVED , function(id, text, ts)
        {
            console.log("ofmeet.js message", id, text, ts);

            if (enableCaptions && text.indexOf("http") != 0)
            {
                of.subtitles.innerHTML = id.split("-")[0] + " : " + text;
            }
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.USER_LEFT, function(id)
        {
            console.log("ofmeet.js user left", id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.USER_JOINED, function(id)
        {
            console.log("ofmeet.js user joined", id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, function(id)
        {
            //console.log("ofmeet.js dominant speaker changed", id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_REMOVED, function(track)
        {
            console.log("ofmeet.js track removed", track.getParticipantId(), track.getType());
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_ADDED, function(track)
        {
            console.log("ofmeet.js track added", track.getParticipantId(), track.getType());
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, function(track)
        {
            console.log("ofmeet.js track muted", track.getParticipantId(), track.getType(), track.isMuted());
        });

        if (APP.conference.roomName)
        {
            if (of.username && of.password && enableRecord && parent && parent.startRecorder)
            {
                parent.startRecorder(recordAudio, recordVideo, APP.conference.localAudio.stream, APP.conference.localVideo.stream, room, APP.conference.getMyUserId(), of.username, of.password);

                var audioFileName = room + "." + APP.conference.getMyUserId() + ".audio.webm";
                var videoFileName = room + "." + APP.conference.getMyUserId() + ".video.webm";

                var audioFileUrl = "https://" + location.host + "/ofmeet-cdn/recordings/" + audioFileName;
                var videoFileUrl = "https://" + location.host + "/ofmeet-cdn/recordings/" + videoFileName;

                if (recordAudio)
                {
                    APP.conference._room.sendTextMessage(audioFileUrl);
                }
                else

                if (recordVideo)
                {
                    APP.conference._room.sendTextMessage(audioFileUrl);
                    APP.conference._room.sendTextMessage(videoFileUrl);
                }
            }

            if (enableTranscription)
            {
                setupSpeechRecognition();
                of.recognition.start();
            }
        }
    }


    function setupSpeechRecognition()
    {
        console.log("setupSpeechRecognition", event);

        of.recognition = new webkitSpeechRecognition();
        of.recognition.lang = "en-GB";
        of.recognition.continuous = true;
        of.recognition.interimResults = false;

        of.recognition.onresult = function(event)
        {
            console.log("Speech recog event", event)

            if(event.results[event.resultIndex].isFinal==true)
            {
                var transcript = event.results[event.resultIndex][0].transcript;
                console.log("Speech recog transcript", transcript);
                sendSpeechRecognition(transcript);
            }
        }

        of.recognition.onspeechend  = function(event)
        {
            console.log("Speech recog onspeechend", event);
        }

        of.recognition.onstart = function(event)
        {
            console.log("Speech to text started", event);
            of.recognitionActive = true;
        }

        of.recognition.onend = function(event)
        {
            console.log("Speech to text ended", event);

            if (of.recognitionActive)
            {
                //console.warn("Speech to text restarted");
                of.recognition.start();
            }
        }

        of.recognition.onerror = function(event)
        {
            console.error("Speech to text error", event);
        }
    }

    function sendSpeechRecognition(result)
    {
        if (result != "" && APP.conference && APP.conference._room)
        {
            var message = "[" + result + "]";
            console.log("Speech recog result", APP.conference._room, message);

            APP.conference._room.sendTextMessage(message);
            of.currentTranslation = [];
        }
    }

    window.addEventListener("beforeunload", function(e)
    {
        console.log("ofmeet.js beforeunload");
        //e.returnValue = 'Ok';
    });

    window.addEventListener("unload", function (e)
    {
        console.log("ofmeet.js unload");

        //localStorage.removeItem("xmpp_username_override");
        //localStorage.removeItem("xmpp_password_override");

        //localStorage.removeItem("uport.email");
        //localStorage.removeItem("uport.name");
        //localStorage.removeItem("uport.avatar");

        APP.conference._room.leave();

        if (of.connection)
        {
            of.connection.disconnect();
        }

        //stopRecorder();
    });

    window.addEventListener("load", function()
    {
        console.log("ofmeet.js load");

        if (localStorage.getItem("uport.email"))    APP.conference.changeLocalEmail(localStorage.getItem("uport.email"));
        if (localStorage.getItem("uport.name"))     APP.conference.changeLocalDisplayName(localStorage.getItem("uport.name"));
        if (localStorage.getItem("uport.avatar"))   APP.conference.changeLocalAvatarUrl(localStorage.getItem("uport.avatar"));

        setTimeout(function() {setup();}, 1000);
    });

    config.p2p = {
        enabled: true,
        stunServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ],
        preferH264: true
    }

    // Suspending video might cause problems with audio playback. Disabling until these are fixed.

    config.disableSuspendVideo = true;

    return of;

}(ofmeet || {}));
