/**
 * ofmeet.js
 */

var ofmeet = (function(of)
{
    var firstTime = true;
    var firstTrack = true;
    var participants = {}

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
                    var json = JSON.parse($(this).text());

                    if (json.event == "ofmeet.event.sip.join")
                    {
                        addSipParticipant(json);
                    }
                    else

                    if (json.event == "ofmeet.event.sip.leave")
                    {
                        removeSipParticipant(json);
                    }


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

        //of.subtitles = document.getElementById("subtitles");

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
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.MESSAGE_RECEIVED , function(id, text, ts)
        {
            console.log("ofmeet.js message", id, text, ts);

            //if (OFMEET_CONFIG.enableCaptions)
            //{
            //    of.subtitles.innerHTML = id.split("-")[0] + " : " + text;
            //}
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

            if (APP.conference.getMyUserId() == track.getParticipantId() && of.localStream)
            {
                var tracks = of.localStream.getAudioTracks();

                for (var i=0; i<tracks.length; i++)
                {
                    tracks[i].enabled = !track.isMuted();
                }
            }
        });

        if (APP.conference.roomName)
        {
            //if (OFMEET_CONFIG.enableTranscription)
            //{
                setupSpeechRecognition();
                of.recognition.start();
            //}
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
            console.log("Speech recog result", APP.conference._room, message,  localStorage.getItem("xmpp_username_override"), localStorage.getItem("uport.name"));

            APP.conference._room.sendTextMessage(message, localStorage.getItem("uport.name"));
            of.currentTranslation = [];
        }
    }

    window.addEventListener("beforeunload", function(e)
    {
        console.log("ofmeet.js beforeunload");

        localStorage.removeItem("xmpp_username_override");
        localStorage.removeItem("xmpp_password_override");
        localStorage.removeItem("uport.email");
        localStorage.removeItem("uport.name");
        localStorage.removeItem("uport.avatar");           

        APP.conference._room.leave();

        if (of.connection)
        {
            of.connection.disconnect();
        }

        //e.returnValue = 'Ok';
    });

    window.addEventListener("unload", function (e)
    {
        console.log("ofmeet.js unload");

        localStorage.removeItem("xmpp_username_override");
        localStorage.removeItem("xmpp_password_override");
        localStorage.removeItem("uport.email");
        localStorage.removeItem("uport.name");
        localStorage.removeItem("uport.avatar");        
        
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
