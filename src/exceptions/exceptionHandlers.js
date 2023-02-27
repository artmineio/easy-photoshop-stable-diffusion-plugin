
const {BadRequestError, InternalServerError, UiError, NetworkError} = require("./Exceptions");
const {photoshopApp} = require("../photoshop/PhotoshopApp");

// UXP just swallows exceptions without any logs, so we need to either log them or show to the user
// Wrap the callback and return a method that handles exceptions properly
export const showingErrors = (callback) => {
  return async (...args) => {
    try {
      const result = callback(...args)
      if (result.then) {
        await result;
      }
    } catch (e) {
      console.error(e);
      console.error(e.stack);
      if (
        e instanceof BadRequestError
        || e instanceof InternalServerError
        || e instanceof UiError
        || e instanceof NetworkError
      ) {
        // photoshopApp.showAlert(e.message);
      } else {
        // photoshopApp.showAlert("Something went wrong! Please contact the developer!");
      }
    }
  }
}

// Same as above but also run it
export const runShowingErrors = (callback) => {
  return showingErrors(callback);
}
