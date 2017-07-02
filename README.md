# Sortie.js

[![Build Status](https://travis-ci.org/gregtyler/sortie.js.svg?branch=master)](https://travis-ci.org/gregtyler/sortie.js)

An inoffensive table sorter for developers. Great features, no dependencies, no nonsense.

## Usage

If you download the repository, you'll find the ready-to-use JavaScript source in the `build` file. Include that in your page, and then apply it to the table you want to sort

```html
<script src="[...]/sortie.min.js"></script>
<script type="text/javascript">
Sortie.create(document.getElementById('tableToSort'));
</script>
```

Sortie doesn't use or rely on jQuery; you should specify a raw Element object, using a function like `document.getElementById` or `document.querySelector`. You can find more about `document.querySelector` [here](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector).

If you insist on using jQuery to retrieve, you can easily extract the Element with the [get method](https://api.jquery.com/get/#get1):
```javascript
Sortie.create($table.get(0));
```

## Integration/API
There are two major integration/API points for Sortie. The first is at initialisation, in which you define how Sortie should manifest itself on the table. After initalisation, integration is driven through events.

### Initialisation
Sortie is initialised with the `Sortie.create` function. This can take a second parameter of an object of initialisation options, as outlined in the table below. Where noted, some options can also be provided as a data attribute (e.g. `data-sortie-initialsort=..`) on the table. I generally find this an easier method for any table-specific options.

| Option | Default value | Data attribute | Notes |
| ------ | ------------- | -------------- | ----- |
| `sort` | _none_ | `data-sortie` | A pipe-separated list of how to save each column. e.g. `a|i|d:dd/mm/yyyy` will sort the first column alphabetically, the second as integers and the third as dates in the format `dd/mm/yyyy`. For more information about comparison functions and how to add your own, see [Comparison functions](#Comparison functions) below. |
| `initialsort` | _none_ | `data-sortie-initialsort` | The [0-indexed](https://en.wikipedia.org/wiki/Zero-based_numbering) column to sort by after Sortie has initalised. Sorts ascending by default, append 'D' to sort descending. (e.g. `5D`) |
| `marks` | `{asc: '&#8595;', desc: '&#8593;', unsorted: '&#8597;'}` | | The markers to use to demonstrate how each column is sorted to the user. These accept HTML so can be SVG icons, font icons or images. |

### Events
Sortie uses [custom events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events) to allow interaction after initialisation. You can listen for events after Sortie has performed various actions, or send events to force Sortie to take an action.

#### `sortie:afterSorted`
Sortie emits the `sortie:afterSorted` event after a table has been sorted (by the user or otherwise). It is emitted from the `<table>` element.

```javascript
document.getElementById('tableToSort').addEventListener('sortie:afterSorted', () => {
  console.log('table sorted');
});
```

#### `sortie:sortAsc` and `sortie:sortDesc`
You can send the `sortie:sortAsc` and `sortie:sortDesc` events to a `<th>` to sort by that column. The column will be sorted ascending or descending, according to the event sent.

```javascript
var th = document.getElementById('tableNameHeader');
th.dispatchEvent('sortie:sortAsc'); // Sorts table by "name" column, from A-Z
```

## Comparison functions
There are three default comparison functions included in Sortie. These are specified in the `data-sortie` attribute or the `sort` initialisation parameter (see [Initialisation](#Initialisation) above) for each column.

`a` or `alpha` sorts the column alphabetically. Internally, the [`localeCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) function is used for comparison. Only text content inside the table cell is used, not HTML content. This is done using the element's [`textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) property.

`i` or `int` sorts the column numerically. It casts all cells to integers using [`parseInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt), assuming base 10.

`d` or `date` sorts the column in date order. You must specify how the date is formatted in the cell as this cannot be determined automatically. The format can include `dd`, `mm`, `yyyy`, `hh`, `ii` (minutes) and `ss`. Word versions of months are not supported. If you want to use more complex date formats, it may be easier to add a data attribute to each cell of the date's UNIX timestamp and add a custom comparison function to sort on those.

### Custom comparison functions
You can define your own comparison functions when the defaults are not sufficient. This allows you to perform sorts on more complex data interpretation, or using HTML attributes on the table cells.

Custom comparison functions are registered with the function `Sortie.registerComparison`. The first attribute should be an array of phrases to match (e.g. 'a' and 'alpha' above), and the second should provide the comparison function. The first two arguments to the comparison function will be the table cells to compare.

You can also allow your custom comparison function to take arguments (like the default date comparison function does). These are specified in the initialisation after a colon and separated by commas. The arguments are sent as an array in the third parameter of the custom comparison function.

An example custom comparison function using data attributes is shown below. It could be specified in the initialisation as `data:data-country` to sort a column based on the "data-country" attribute of each cell.

```javascript
Sortie.registerComparison(['data'], function(cellA, cellB, args) {
  var aData = cellA.getAttribute(args[0]) || '';
  var bData = cellB.getAttribute(args[0]) || '';
  return aData.localeCompare(bData);
});
```

## Project goals
 - Simple and small
 - Immediate support for internationalisation
 - Immediately accessible
 - No CSS, so it can work with other libraries (Bootstrap, Foundation etc.)
 - Uses only Vanilla JavaScript
 - Good browser support

## Compiling
If you make edits to Sortie's source files and need to recompile, you'll first need to install the relevant gulp packages. This can easily be done by opening a command window at in the project directory and typing `npm install`.

To build, in a command window in the same directory, type `gulp`. This will compile the files and put them in the `build` directory. It will also start a watcher in the background to automatically rebuild the files after future edits to the source file.

## License
Sortie is licensed under the terms of the GPL Open Source license. It is free and will remain free.
