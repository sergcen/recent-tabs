export default method => (...args) =>
    new Promise(resolve => method(...args, resolve));