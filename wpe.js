import { FileSystem } from "https://deno.land/x/quickr@0.8.1/main/file_system.js"
import { Console, cyan, yellow, green } from "https://deno.land/x/quickr@0.8.1/main/console.js"
import { binaryify } from "https://deno.land/x/binaryify@2.5.5.0/binaryify_api.js"
import { convertUint8ArrayToBase64String } from "https://esm.sh/gh/jeff-hykin/good-js@1.18.0.0/source/flattened/convert_uint8_array_to_base64_string.js"
import { parseArgs, flag, required, initialValue } from "https://esm.sh/gh/jeff-hykin/good-js@1.18.0.0/source/flattened/parse_args.js"
import { didYouMean } from "https://esm.sh/gh/jeff-hykin/good-js@1.18.0.0/source/flattened/did_you_mean.js"
import { normalizePath } from "https://esm.sh/gh/jeff-hykin/good-js@d85276f/source/flattened/normalize_path.js"

// need to import this bundled code to properly convert base64 string back to a uint8array
import stringForConvertBase64StringToUint8ArrayJs from "./convert_base64_string_to_uint8_array.js.binaryified.js"

const output = parseArgs({
    rawArgs: Deno.args,
    fields: [
        [["--help"], flag ],
        [["--version"], flag ],
        [["--output-format"], initialValue(`utf8-string`), ],
        [["--output-folder"], initialValue(`./pkg`),],
        [["--main-file-name"], initialValue(`main_embedded.js`),],
        [["--wasm-in-js-name"], initialValue(`wasm_bytes.js`),],
        [["--wasm-source-path"], initialValue(null),],
        [["--js-source-path"], initialValue(null),],
        [["--silent"], flag,],
    ],
    namedArgsStopper: "--",
    allowNameRepeats: true,
    valueTransformer: JSON.parse,
    isolateArgsAfterStopper: false,
    argsByNameSatisfiesNumberedArg: true,
    implicitNamePattern: /^(--|-)[a-zA-Z0-9\-_]+$/,
})
didYouMean({
    givenWords: Object.keys(output.implicitArgsByName).filter(each=>each.startsWith(`-`)),
    possibleWords: Object.keys(output.explicitArgsByName).filter(each=>each.startsWith(`-`)),
    autoThrow: true,
    suggestionLimit: 1,
})

var { help, version, silent, outputFormat, outputFolder, mainFileName, wasmInJsName, wasmSourcePath, jsSourcePath } = output.explicitArgsByName
const helpForOutputFormats = `
    - ${cyan`utf8-string`}: this is the most compressed (faster load, smaller bundle)
        but uses some CPU to convert the string back to a Uint8Array
        ex: ${yellow`export default stringToBytes(
            \`\\u0000xm\\u0001\\u0000\\u0000\\u0000\\u0000\\u0001A\\u000b\`\\u0002\\u0000\\u0001\\\`\`
        )`}
        Except those \\u00XX's would be raw characters, not unicode escape sequences
    
    - ${cyan`base64-string`}: uses about the same CPU as utf8-string, much less compressed,
        but is easier to understand/validate
        ex: ${yellow`export default convertBase64StringToUint8Array("AQIDBAUGBwgJCgsMDQ4PEA==")`}
    
    - ${cyan`inlined-array`}: uses basically no CPU, but the least compressed. 
        It is the most easy to understand/validate.
        ex: ${yellow`export default new Uint8Array([255,1,2,88,4,5,6,7,8,9])`}
`
if (help) {
    console.log(`
        wpe should be run immediately after calling wasm-pack build --target web
        ex: ${cyan`wasm-pack`} build --target web && ${cyan`wpe`}

        Options/Examples:
            ${cyan`wpe`} --output-format utf8-string
            ${cyan`wpe`} --output-format base64-string
            ${cyan`wpe`} --output-format inlined-array
            
            ${cyan`wpe`} --silent
            # avoids printing the success message
            
            ${cyan`wpe`} --main-file-name my_main.js
            
            ${cyan`wpe`} --output-folder ./pkg
            # Note: output folder needs to contain the output of wasm-pack build --target web
            
            ${cyan`wpe`} --wasm-in-js-name wasm_as_uint8array.js
        
        Notes:
            For the output-format options, see the following:
    `.replace(/\n        /g, "\n") + helpForOutputFormats)
    Deno.exit(0)
}
if (version) {
    console.log(`v1.0.0.3`)
    Deno.exit(0)
}
const validOutputFormats = [`utf8-string`, `base64-string`, `inlined-array`]
if (!validOutputFormats.includes(outputFormat)) {
    throw new Error(`Invalid output format: ${outputFormat}. Valid options are: ${validOutputFormats.join(`, `)}\n\n    ex: ${cyan`wpe --output-format utf8-string`}\n\nNotes:
`+ helpForOutputFormats)
}


// 
// get wasm source path and js source path
// 
const pathToPackageJson = `${outputFolder}/package.json`
if (!wasmSourcePath || !jsSourcePath) {
    try {
        const data = JSON.parse(await FileSystem.read(pathToPackageJson))
        wasmSourcePath = wasmSourcePath || `${outputFolder}/${data.files.find(each=>each.endsWith(".wasm"))}`
        jsSourcePath = jsSourcePath || `${outputFolder}/${data.files.find(each=>each.endsWith(".js"))}`
    } catch (error) {
        throw Error(`(from wpe)\nTo find the wasm file, I need to read the package.json file in the output folder (usually ./pkg). But when I tried to read ${JSON.stringify(pathToPackageJson)}, I got this error: ${error.message}.\n\nNote you can use the --output-folder flag to specify a folder other than ./pkg\nIn a last-ditch effort you can also specify --wasm-source-path and --js-source-path directly (so I don't even read the package.json)`)
    }
}
if (!wasmSourcePath) {
    throw new Error(`wasm file not mentioned in .files of ${pathToPackageJson} and was not specified with --wasm-source-path`)
}
if (!jsSourcePath) {
    throw new Error(`js file not mentioned in .files of ${pathToPackageJson} and was not specified with --js-source-path`)
}

// create the wasm-in-js file
if (outputFormat === `base64-string`) {
    const wasmBytes = await FileSystem.read(wasmSourcePath)
    // btoa is problematic for non-string inputs so we have to convert to base64 string manually :(
    const wasmBytesBase64 = convertUint8ArrayToBase64String(wasmBytes)
    await FileSystem.write({
        path: `${outputFolder}/${wasmInJsName}`,
        data: `export default ${wasmBytesBase64.toString()}`,
    })
} else if (outputFormat === `base64-string`) {
    const wasmBytes = await FileSystem.read(wasmSourcePath)
    // btoa is problematic for non-string inputs so we have to convert to base64 string manually :(
    const wasmBytesBase64 = convertUint8ArrayToBase64String(wasmBytes)
    await FileSystem.write({
        path: `${outputFolder}/${wasmInJsName}`,
        data: `${stringForConvertBase64StringToUint8ArrayJs}\nexport default convertBase64StringToUint8Array(${JSON.stringify(wasmBytesBase64)})`,
    })
} else {
    await binaryify({
        pathToBinary: wasmSourcePath,
        pathToBinarified: outputFolder+"/"+wasmInJsName,
        disableSelfUpdating: true, // default is false
    })
}

const jsSourceRelativePath = FileSystem.makeRelativePath({from: outputFolder, to: jsSourcePath})
// create the main.js file
await FileSystem.write({
    path: `${outputFolder}/${mainFileName}`,
    data: `import wasmBytes from ${JSON.stringify(`./${FileSystem.normalizePath(wasmInJsName)}`)}
import * as wasmPack from ${JSON.stringify(`./${FileSystem.normalizePath(jsSourceRelativePath)}`)}
export * from ${JSON.stringify(`./${FileSystem.normalizePath(jsSourceRelativePath)}`)}
wasmPack.initSync({module:wasmBytes})
export default wasmPack
`,
})
let mainOutputPath = normalizePath(`${outputFolder}/${mainFileName}`, { forcePrefix: true })
if (!silent) {
    console.log(`
        ${cyan`Success!`}
        
        You can import the wasm file into your project like this:
        
        ${cyan`import`} { ${yellow`yourWasmFunc`} } ${cyan`from`} ${green(JSON.stringify(mainOutputPath))}
        // no need to call initSync, it's done already
        ${yellow`yourWasmFunc`}("World")
    `.replace(/\n        /g, "\n"))
    console.log(``)
}