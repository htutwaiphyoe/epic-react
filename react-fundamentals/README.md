# React Fundamentals

## 01 - Basic JavaScript-rendered Hello World

- create a div to show Hello World and append it in root element
- normal work flow of react
- create own root element and append it in body
- react portal
- [script attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attributes)
- [js modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [js append](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)

## 02 - Intro to raw React APIs

- use static url script of React and ReactDOM from unpkg.com
- unpkg serves packages in npm as a static url
- it creates global variables React and ReactDOM
- React: responsible for creating React elements (kinda like
  document.createElement())
- ReactDOM: responsible for rendering React elements to the DOM (kinda like
  rootElement.append())
- React abstracts away imperative and gives declarative approach
- separating packages for multiple platforms like ReactNative
- for nested elements, React.createElement accepts multiple arguments (type,
  config, children1, children2,...)
- Value of children is starting from third argument
- children props can be array if multiple values are provided
- [react source code](https://github.com/facebook/react/blob/48907797294340b6d5d8fecfbcf97edf0691888d/packages/react-dom/src/client/ReactDOMComponent.js#L416)
- [imperative vs declarative](https://ui.dev/imperative-vs-declarative-programming)

## 03 - JSX

- JSX is a HTML-like syntactic sugar for on top of the raw React API
- JSX is easier to read and understand
- JSX is not actually JavaScript and browser does not understand JSX,
- need to compile to React.createElement() using a code compiler (Babel)
- Babel is written in JavaScript, so run it in the browser to compile code on
  the fly
- in production, used pre-compiled code
- text/babel means babel takes content of script tag, compiles and generates new
  script including compiled version
- babel adds new script in HEAD element
- use curly brace for dynamic Expressions (interpolation)
- interpolation only accepts expressions
- use spread operator for object to pass in JSX
- [babel repl for JSX](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=App&corejs=3.6&spec=false&loose=false&code_lz=MYewdgzgLgBArgSxgXhgHgCYIG4D40QAOAhmLgBICmANtSGgPRGm7rNkDqIATtRo-3wMseAFBA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=react&prettier=true&targets=&version=7.17.5&externalPlugins=&assumptions=%7B%7D)
- [react jsx](https://reactjs.org/docs/introducing-jsx.html)
- [react spread attributes](https://reactjs.org/docs/jsx-in-depth.html#spread-attributes)

## 04 - Creating custom components

- Components are basically functions which return something that can render
  (more React elements (JSX), strings, null, numbers, etc.)
- To reduce the duplication for creating the React elements
- React.createElement() can accept first argument which is a type as a function
  which returns something that can render
- only components include in React Dev Tools, function calls are not included
