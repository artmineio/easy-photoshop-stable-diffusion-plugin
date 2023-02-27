require("./axiosConfig");
const {isWindowsPlatform} = require("../utils/osUtils");
const {NetworkError, BadRequestError, InternalServerError} = require("../exceptions/Exceptions");
const axios = require("axios");

class AjaxClient {

  request = async (method, url, requestBody) => {
    // const requestBodyJson = requestBody ? `: ${JSON.stringify(requestBody, null, 2)}` : "";
    // console.log(`Making request to ${url}${requestBodyJson}`)
    try {
      const request = {
        method,
        url,
      }
      if (requestBody) {
        request["data"] = requestBody;
      }
      const response = await axios(request);
      return response["data"]
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const httpErrorCode = error.response?.status
        const errorBody = error.response?.data
        console.error(`Error making request to ${url} with code ${httpErrorCode}: ${JSON.stringify(errorBody, null, 2)}`)
        if (httpErrorCode >= 500) {
          throw new InternalServerError()
        }
        if (httpErrorCode >= 400) {
          throw new BadRequestError(errorBody?.detail)
        }
        throw Error("Something went totally wrong!");
      }

      if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest
        throw new NetworkError(
          `Cannot reach local server at http://localhost:8088/`
        )
      }

      // Something else
      throw error;
    }
  }

  get = (url) => {
    return this.request('get', url)
  }

  post = (url, requestBody) => {
    return this.request('post', url, requestBody)
  }

  put = (url, requestBody) => {
    return this.request('put', url, requestBody)
  }
}

export const ajaxClient = new AjaxClient();
