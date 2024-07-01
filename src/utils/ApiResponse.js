class ApiResponse{
    constructor(statusCode,data,message = "success",success = statusCode < 400){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = success
    }
}

export {ApiResponse}