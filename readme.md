# What is this for?

This is a little tool for wasm-pack that helps embed the wasm file into an easily-bundled javascript file.

# How do I use it?

```sh
# install deno (if you don't have it)
curl -fsSL https://deno.land/install.sh | sh
# install this tool (wpe)
deno install -n wpe -Afg https://esm.sh/gh/jeff-hykin/wasm-pack-embed-unofficial@1.0.0.2/wpe.js
# call wasm-pack and wpe
wasm-pack build --target web && wpe --output-folder ./pkg
```

Where ever you want to use the module, you can do: 
```js
import { someWasmFunc, greet } from "./pkg/main_embedded.js"
// no need to call initSync, it's done already
greet("World")
```

Or, if you want to load it yourself, you can do:
```js
import wasmAsUtf8Array from "./pkg/wasm_bytes.js"
// manually load it into the wasm-pack module
import { initSync, someWasmFunc, greet } from "./pkg/your_wasm_project.js"
wasmPack.initSync({module:wasmAsUtf8Array})
greet("World")
```

# What options are available?

Options/Examples:
```
wpe --output-format utf8-string
wpe --output-format base64-string
wpe --output-format inlined-array

wpe --main-file-name my_main.js

wpe --output-folder ./pkg
# Note: output folder needs to contain the output of wasm-pack build --target web

wpe --wasm-in-js-name wasm_as_uint8array.js
```

For the output-format options, see the following:
    
- **utf8-string**: this is the most compressed (faster load, smaller bundle)
    but uses some CPU to convert the string back to a Uint8Array<br>
    ```
    export default stringToBytes(
        `\u0000xm\u0001\u0000\u0000\u0000\u0000\u0001A\u000b`\u0002\u0000\u0001\``
    )
    ```
    Except those \u00XX's would be raw characters, not unicode escape sequences

- **base64-string**: uses about the same CPU as utf8-string, much less compressed,
    but is easier to understand/validate
    ex: `export default convertBase64StringToUint8Array("AQIDBAUGBwgJCgsMDQ4PEA==")`

- **inlined-array**: uses basically no CPU, but the least compressed. 
    It is the most easy to understand/validate.
    ex: `export default new Uint8Array([255,1,2,88,4,5,6,7,8,9])`
