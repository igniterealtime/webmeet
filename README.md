# WebMeet
A web component that can be embedded in a web site to enable live meetings with Openfire users

## Introduction
This is a full-featured web chat component that can be added to any web page. 
The component allows visitors of a web site to chat directly with members of a work group or team in a multi-user chat (MUC) through an integrated web client. The web component can be customised and re-branded with HTML/CSS.

It embeds [converse.js](http://www.conversejs.org) in the web site to handle the messaging with Openfire and depending on the configuration, it can initiate a video-conference using [Openfire Meetings](http://github.com/igniterealtime/Openfire-Meetings) or [FreeSWITCH Verto Communicator](http://freeswitch.org/confluence/display/FREESWITCH/Verto+Communicator) or dialback with SIP (CTX-Phone) to a telephone number.


This is how to add WebMeet to your web site in a few simple steps.

## How to do it

Let’s assume that you have the following pre-existing index.html page on your web site:

`````
<html>
  <body>
    <h1>This is my web site!</h1>
    <p>Welcome!</p>
  </body>
</html>
`````
Now, you want to add the WebMeet component. You can do that before the </body> tag with following 2 lines of code:

`````
<html>
  <body>
    <h1>This is my web site!</h1>
    <p>Welcome!</p>

    <link type="text/css" rel="stylesheet" href="ofmeet.css">
    <script src="ofmeet.js"></script>
    
  </body>
</html>
`````

The <script/> tag above brings in the WebMeet web control and the <link/> tag brings in the default css file to style it. 
Copy the webmeet, jitsimeet, verto and phone folders to the same folder as your index.html page. Thats it!! Reload your web page.

You should now see a coloured chat bubble that remains on the bottom right side of your web page as you scroll up and down your web page. Click on it to open the chat window. Enter a nick name for the multi-user chat and hit enter.

The toolbar offers you the following messaging/chat features:

1. emojis
2. ofmeet or verto audio/video conference
3. SIP telephone callback
4. upload files
4. exit and return to chat bubble

## Screen Shots

<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen1.png" />
<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen3.png" />
<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen4.png" />
<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen5.png" />


## Additional considerations

1. The default configuration for Converse.js is to assume that Openfire and FreeSWITCH are on the same host as the web server and uses window.hostname as the XMPP and SIP domain names. Edit ofmeet/converse.html to match your preference.

`````
    converse.initialize({
        authentication: 'anonymous',
        auto_login: true,
        auto_join_rooms: [
            'lobby@conference.' + location.hostname,
        ],
        play_sounds: true,
        sounds_path: "sounds/",
        notification_icon: "image.png",
        muc_domain: "conference." + location.hostname,
        domain_placeholder: location.hostname,
        registration_domain: location.hostname,
        locked_domain: location.hostname,
        whitelisted_plugins: ["converse-singleton", "converse-inverse", "ofmeet"],
        blacklisted_plugins: ["converse-minimize", "converse-dragresize"],
        bosh_service_url: 'https://' + location.host + '/http-bind/',
        websocket_url: 'wss://' + location.host + '/ws/',
        jid: location.hostname,
        notify_all_room_messages: true,
        auto_reconnect: true,
        allow_non_roster_messaging: true,
        view_mode: 'embedded',
        ofmeet_invitation: 'Please join meeting at:',
        ofswitch: false
    });
`````

2. To configure SIP.js for telephone call back using CTX-Phone, configure the .../phone/scripts/config.js file to connect to your Asterisk or FreeSWITCH PBX.

`````
var user = {
    Destination : "3001",
    User        : "1008",
    Pass        : "1234",
    Realm       : location.hostname,
    Display     : "Guest",
    WSServer    : "wss://" + location.host + "/sip/proxy?url=ws://" + location.hostname + ":5066"
};
`````

3. If you set ofswitch as true to indicate you want to use Verto Communicator instead of Openfire Meetings, then you have an additional step to modify the config.json file for VC. These are my settings with the ofswitch plugin for Openfire.

`````
{
    "extension": "guest",
    "login": "guest",
    "password": "guest",    
    "autologin": true,
    "autocall": "3000",    
    "googlelogin": false,
    "wsURL": "wss://desktop-545pc5b:7443/sip/proxy?url=ws://192.168.1.252:8081"    
}
`````
4. There is a lot more to make this secure for public internet use, but that is beyond the scope of this readme.
