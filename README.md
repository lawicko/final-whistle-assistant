# Final Whistle assistant
I created this browser extension to address some of the problems that, in my opinion, the game interface has. The main idea was to make the midfield dominance easily visible on the squad page as well as on the player page. Midfield dominance being (as of time of writing - August 2025) the main factor in opportunity creation, I think it deserves much more attention than just a mention in the manual.

## Supported brosers
1. Chromium based browsers like Chrome or Brave - [the extension is available in the Chrome web store](https://chromewebstore.google.com/detail/final-whistle-assistant/hcnoehlpicjabafnchohpbocakdnmimn).
2. Firefox - [the plugin is available in the Firefox extensions page](https://addons.mozilla.org/en-US/firefox/addon/final-whistle-assistant/)

## Options - Available modules
The extension is split into modules, each module is responsible for different functionality and you can turn each module on or off in the extension settings.

As of version **1.1.0** the settings page on Firefox looks like this
![Firefox settings page](images/options_firefox.jpg)

Similarly this is the settings page on the Chromium browsers
![Chromium settings page](images/options_chromium.jpg)

Use it to enable/disable modules you like. Remember to reload the Final Whistle website for the changes to take effect.

## Academy Buttons module
The goal of this module is to move the **Hire** and **Fire** buddons apart to prevent accidental misclicks. It was inspired by one of the posts from the [Requested Features List topic](https://www.finalwhistle.org/en/forum/topic/125/page/103)
![Academy Buttons](images/academy_buttons.jpg)

## Calendar module
Calendar module adds **Y** and **S** letters to the match marker on the fixtures screen and on the club screen (upcoming matches section). This is again inspired by the [Requested Features List topic](https://www.finalwhistle.org/en/forum/topic/125/page/103) and the goal is to help distinguish which match is youth and which match is seniors, for the one of us that can't remember which color is what.
![Calendar - Fixtures](images/calendar01.jpg)
![Calendar - Fixtures](images/calendar02.jpg)

## Player module
Player module adds additional row for the midfield dominance calculation in the computed properties table on the player page. It shows both current and potential midfield dominance contribution of a player. If you hover over the numeric values you will see the formulas that are used for calculations.
![Player module](images/player.jpg)

As of version **1.1.0** the special talents are **not** taken into account, so keep that in mind that it's not 100% accurate yet.

## Players module
The main idea behind the players module is to show the midfield dominance on your squad page. In addition it also shows the long shot ability and midfield dominance when in advanced position (**L/RW**, **OM**, **DM**). If you hover over the numeric values you will see the formulas that are used for calculations.
![Players module](images/players.jpg)

## Row Highlight module
Row highlight allows you to highlight any row on your or your opponent squad page. It can be useful when analyzing lineups for the upcoming games.
![Row Highlight module](images/row_highlight.jpg)

## Tags module
Tags module makes player tags much bigger and allows you to customize tag colors. The original game interface is not ideal, in my opinion, when it comes to tags size and the color selection. With the tags module you get the ability to choose the colors that are more suitable to your needs - do this in the extension options. The tags on the squad sceen and on the training screen are affected.
![Tags on the squad screen](images/tags01.jpg)
![Tags on the training screen](images/tags02.jpg)

## Version history
### 1.1.0 - current version
 - Added working options screen
### 1.0.4
 - Added midfield dominance calculations to the computed skills table on the player page
### 1.0.3
 - Fixed the scroll bar appearing at the bottom of the player screen
### 1.0.2
 - Extension becomes multiplatform - works on FF and Chrome-based browsers
 - Updated the midfield dominance calculation for season 25
 - Added the LS formula and calculations to be displayed on hover
### 1.0.1
 - Aligned the players.js script to function properly with the recent changes on the website
### 1.0.0
 - Initial version with 4 modules