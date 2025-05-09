# ARKStatusOverlay
 A simple overlay app for ARK Survival Ascended to see your server's status.

# TODO:
 Next update I'll probably change sever selection a bit to streamline things.

# Installation:
 This requires node.js and electron.

 For node package manager, you'd need to install electron, asa-query, soundplay
 
 If you're using Windows 64bit, I have a portable .exe on the release page: https://github.com/DjRand/ARKStatusOverlay/releases/tag/Release

# Usage:
 The overlay is click through so it won't interfere with your mouse.
 One blue block on the Overlay however is clickable, clicking and dragging this allows you to move the Overlay around.
 The app does have a system tray icon which you can right click to access a few features:
   * Show/Hide the overlay.
   * Edit Servers - Just enter one server, I don't have it set up for multiple server checking as of yet.  Maybe in a future release, or maybe I'll stick with just a single server.
   * Check interval - How often it checks the server's status.
   * Check Now - Forces it to check the server status right now.

# Known issues/bugs:
 * There's sometimes a 'white bar' that appears behind the overlay.  Haven't quite figured out how to entirely prevent this, seems to be a transparency issue when electron tries to 'refresh' the app.
   ** If the bug happens to you, just open and close the edit servers window, should force it to fix it.
 * Edit Servers shows that it accepts more than one server, and it technically does, but I haven't set the display up to display multiple servers at the same time, and I'm not sure if I'll go this route or not.
 
 
