## 1.0.1
This version pushes some bug fixes encountered when testing on the online (github pages) environment.

### Fixed
* Removed reference to non-existing css file
* Changed translation source for github pages
* Add extra check to make sure database exists and is ready to be used

## 1.0.0
### Initial Release
This version marks the initial public release of Bit Friend's character card editor.
This initial version has all of the basic fields required for a card editor to function well.
Please keep in mind it's still in active development and might be missing some features you like or want to see.

If there's anything you would like to see, you can create an issue card with a ***feature*** label. If a feature you want is alread in the list, you can vote for it using github's emotes (:thumbsup: for yes, :thumbsdown: for no).

### Added Capabilities
**Settings:**
* Added method to toggle between light mode and dark mode
* Added method to change website language
* Added Dutch (Nederlands) language
* Added English language

**Home Page:**
* Added method to import Image (.png) and Json (.json) based character cards
* Added method to create new character cards
* Added method to continue with saved card if one exists
* Added method to remove the entire website cache

**Editor Page:**
* Ability to change fields:
    * Name
    * Description
    * Personality
    * Scenario
    * First Message / Greeting
    * Alternate Greetings
    * Message Examples
    * Creator Name
    * Version
    * Creator Notes
* Added method to undo changes to a field
* Added method to add and remove multiple Alternate Greetings
* Added method to add message examples from a template
* Added method to add / update the time the card was last updated (embeded in metadata), or remove it from the output file
* Added method to add / update the card image (currently only accepts png files)
* Added method to automatically save editing card (5 seconds after last edit was made)

**Back End:**
* Added simple translation handlers
* Added methods to store simple data in browser local storage
* Added methods to store card data in browser built-in database
* Added methods to read and write card data to/from png cards
* Added methods to read and write card data to/from json cards
* Added object with mapped properties for known data fields for easy access to card data fields

### Future plans
* Token counters
* Undo button for card image
* Add method to use templates for descriptions (W++, Boo Style, Attributes, etc.)
* Automatically update last update time if set
* Allow other image types to be used for character card (will automatically be converted to png)