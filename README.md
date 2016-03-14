# Sortie.js

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

## API
_TODO_

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
