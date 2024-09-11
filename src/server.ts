import dotenv from "dotenv";
dotenv.config();

import {
  Metadata,
  Server,
  ServerCredentials,
  credentials,
} from "@grpc/grpc-js";
import {
  WifiServiceService,
  LoginRequest,
  LoginResponse,
} from "./generated/wifi";
import { GuestServiceClient } from "./generated/guest";
import { generateServiceError } from "./utils";
import { Callback } from "./utils/types";

const server = new Server();
const guestServiceClient = new GuestServiceClient(
  process.env.GUEST_SERVICE_URL || "localhost:50051",
  credentials.createInsecure()
);

server.addService(WifiServiceService, {
  async login(
    call: { request: LoginRequest },
    callback: Callback<LoginResponse>
  ) {
    const { lastName, roomNumber } = call.request;

    guestServiceClient.getGuestByLastNameAndRoom(
      { lastName, roomNumber },
      (error, guest) => {
        if (error) {
          callback(generateServiceError(error), null);
          return;
        }

        if (!guest) {
          callback(
            {
              name: "NoUserError",
              message: "No user found",
              code: 13,
              details: "No user found",
              metadata: new Metadata(),
            },
            null
          );
          return;
        }

        guestServiceClient.incrementWifiLoginCount(
          { lastName, roomNumber },
          (error, response) => {
            if (error) {
              callback(generateServiceError(error), null);
              return;
            }

            const loginResponse: LoginResponse = { success: response.success };
            callback(null, loginResponse);
          }
        );
      }
    );
  },
});

const port = process.env.PORT || 50052;
server.bindAsync(
  `0.0.0.0:${port}`,
  ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(`Failed to bind server: ${err.message}`);
      return;
    }
    console.log(`Server running at http://0.0.0.0:${port}`);
  }
);
