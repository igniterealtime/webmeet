# WebMeet
A web component that can be embedded in a web site to provide a fastpath to Pade users

## Introduction
This is a full-featured web chat component that can be added to any web page. 
The component allows visitors of a web site to chat directly with members of a work group or team in a multi-user chat (MUC) through an integrated web client. The web component can be customised and re-branded with HTML/CSS.

It embeds [converse.js](http://www.conversejs.org) in the web site to handle the messaging with Openfire and depending on the configuration, it can initiate a video-conference using [Openfire Meetings](http://github.com/igniterealtime/Openfire-Meetings) or dialback with SIP a telephone number or [FreeSWITCH](http://freeswitch.org/confluence/display/FREESWITCH) audio conference.


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
Copy the widget folder to the same folder as your index.html page. Thats it!! Reload your web page.

<img src="https://github.com/igniterealtime/webmeet/raw/master/screenshots/screen1.png" />

You should now see a coloured chat bubble that remains on the bottom right side of your web page as you scroll up and down your web page. Click on it to open the chat window. 
At this point, you are chatting with the fastpath bot. Answer the questions and provide at least a name, email address and question.
If an agent responds, a groupchat panel will open. Enter a nick name for the multi-user chat and hit enter.

## Additional considerations

1. The default configuration for Converse.js is to assume that Openfire is configured for the demo workgroup. Edit ofmeet.js to match your preference.

`````
converse.initialize({
    auto_login: true,
    theme: 'concord',
    allow_non_roster_messaging: true,
    auto_join_on_invite: true,
    auto_join_private_chats: ['demo@workgroup.' + location.hostname],
    authentication: 'anonymous',
    jid: location.hostname,
    auto_away: 300,
    auto_reconnect: true,
    debug: true,
    singleton: true,
    sticky_controlbox: false,
    websocket_url: 'wss://' + location.host + '/ws/',
    message_archiving: 'always',
    whitelisted_plugins: ["jitsimeet", "audioconf"]
});
`````

2. Edit click2Dial to connect to your Asterisk or FreeSWITCH PBX.

`````
window.click2Dial = {
    custom_button_color: "orange",
    custom_frame_color: "black",
    dial_pad: "true",
    did: "3001",
    display_button: "false",
    div_css_class_name: "btn-style-round-a",
    draggable: "true",
    incompatible_browser_configuration: "hide_widget",
    placement: "bottom-right",
    rating: "false",
    ringback: "true",
    server_url: "./widget",
    show_branding: "false",
    show_frame: "true",
    text: "Ask",
    use_default_button_css: "true",
    protocol: "sip",    // 'sip' or 'xmpp'
    sip: {domain: location.hostname, server: "wss://" + location.host + "/sip/proxy?url=ws://" + location.hostname + ":5066", register: false, caller_uri: "sip:1002@" + location.host, authorization_user: "1002", password: "1234"},
    xmpp: {domain: "meet.jit.si", server: "https://meet.jit.si/http-bind"}
}
`````

3. There is a lot more to make this secure for public internet use, but that is beyond the scope of this readme.
