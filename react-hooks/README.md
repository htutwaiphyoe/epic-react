# React Hooks

## 01. useState: greeting

State can be defined as: data that changes over time.

React.useState is a function that accepts a single argument. That argument is
the initial state for the instance of the component.

React.useState returns an array with two elements which is the state value and
the state updater function. These variables can be named anything but common
convention is to choose a name for the state variable, then prefix set in front
of that for the updater function.

When state updater function is called, React to re-render the component meaning
the entire function is re-run. so when React.useState is called this time, the
value is the latest value. And it continues like that until component is
unmounted (removed from the application), or the user closes the application.

controlled input => value + onChange handler

to be controlled input, value must not be undefined. so best practice is adding
default value.
