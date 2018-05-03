# WebMeet
A web component that can be embedded in a web site to enable live meetings with Openfire users

<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen3.png" />

## Introduction
This is a full-featured web chat component that can be added to any web page. 
The component allows visitors to a web site to chat directly with members of a work group or team in a multi-user chat (MUC) through an integrated web client. The web component can be customised and re-branded with HTML/CSS.

It embeds [converse.js](http://www.conversejs.org) in the web site to handle the messaging with Openfire and depeding on configuration, it can open a windows for a video-conference using [Openfire Meetings](http://github.com/igniterealtime/Openfire-Meetings) or a telephone conference call using [FreeSWITCH Verto Communicator](http://freeswitch.org/confluence/display/FREESWITCH/Verto+Communicator).


This is how to add webmeet to your web site in a few simple steps.

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
<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen1.png" />

The <script/> tag above brings in the WebMeet web control and the <link/> tag brings in the default css file to style it. 
Copy the verto and ofmeet folders to the same folder as your index.html page. Thats it!!

<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen2.png" />

## Additional considerations

1. The defult configuration for converse.js is to assume that Openfire and FreeSWITCH are on the same host as the web server and uses window.hostname as the XMPP and SIP domain names. Edit ofmeet/convese.html to match your preference.

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

2. If you set ofswitch as true to indicate you want to use Verto Communicator instead of Openfire Meetings, then you have an additional step to modify the config.json file for VC. These are my settings with the ofswitch plugin for openfire.

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
3. There is a lot more to make this secure for public use, but that is beyond the scope of this readme.
