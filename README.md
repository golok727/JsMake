# JsMake


Js make is a build tool for compiling c++ files in your project

> This is under development


## Usage


```sh

make.mjs

make.mjs -c "<config-file>.json" # custom config file name, default is makeconfig.json



```

makeconfig.json 

---
```json

{
	"src": "./src",

	"dist": "./dist",

	"executable": "main",

	"includeFileTypes": ["cpp"],

	"runAfterBuild": true
}

```