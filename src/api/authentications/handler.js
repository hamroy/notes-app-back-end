const ClientError = require("../../exceptions/ClientError");

class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler =
      this.deleteAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(request, h) {
    try {
      //validasi
      this._validator.validatePostAuthenticationPayload(request.payload);

      const { username, password } = request.payload;
      const id = await this._usersService.verifyUserCredential(
        username,
        password
      );

      const accessToken = this._tokenManager.generateAccessToken({ id });
      const refreshToken = this._tokenManager.generateRefreshToken({ id });

      //save database
      await this._authenticationsService.addRefreshToken(refreshToken);

      const response = h.response({
        status: "success",
        message: "Authentication berhasil ditambahkan",
        data: {
          accessToken,
          refreshToken,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: "fail",
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async putAuthenticationHandler(request, h) {
    try {
      //validasi
      this._validator.validatePutAuthenticationPayload(request.payload);

      //get input
      const { refreshToken } = request.payload;

      //get database
      await this._authenticationsService.verifyRefreshToken(refreshToken);

      // set token manager
      const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

      const accessToken = this._tokenManager.generateAccessToken({ id });
      return {
        status: "success",
        message: "Access Token berhasil diperbarui",
        data: {
          accessToken,
        },
      };
    } catch (error) {
      //error
      if (error instanceof ClientError) {
        const response = h.response({
          status: "fail",
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteAuthenticationHandler(request, h) {
    try {
      //validasi
      this._validator.validateDeleteAuthenticationPayload(request.payload);

      // get input
      const { refreshToken } = request.payload;

      //get database
      await this._authenticationsService.verifyRefreshToken(refreshToken);

      //hapus token database
      await this._authenticationsService.deleteRefreshToken(refreshToken);

      return {
        status: "success",
        message: "Refresh token berhasil dihapus",
      };
    } catch (error) {
      // error
      if (error instanceof ClientError) {
        const response = h.response({
          status: "fail",
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
} //end class

module.exports = AuthenticationsHandler;
