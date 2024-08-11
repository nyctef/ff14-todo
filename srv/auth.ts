import {
  AuthenticateWithSessionCookieFailureReason,
  WorkOS,
} from "@workos-inc/node";
import { Express } from "express";

// based on https://workos.com/docs/user-management/3-handle-the-user-session/b-manually

export type WorkOSConfig = {
  clientId: string;
  apiKey: string;
  cookiePassword: string;
};

export function setupAuth(app: Express, config: WorkOSConfig) {
  const workos = new WorkOS(config.apiKey, { clientId: config.clientId });
  console.log("setting up workos...");

  app.use(async (req, res, next) => {
    console.log("auth middleware", { p: req.path });
    if (req.path.startsWith("/auth")) {
      // avoid infinite loop
      console.log("...already on auth page");
      return next();
    }

    // If no cookie, redirect the user to the login page
    // console.log({ cookies: req.cookies });
    if (!req.cookies || !req.cookies["wos-session"]) {
      console.log("no wos-session cookie");
      return res.redirect("/auth/login");
    }

    // otherwise check if the cookie is good
    const authResponse =
      await workos.userManagement.authenticateWithSessionCookie({
        sessionData: req.cookies["wos-session"],
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
      });

    const { authenticated } = authResponse;

    if (authenticated) {
      return next();
    }

    // If no session, redirect the user to the login page
    if (
      !authenticated &&
      authResponse.reason ===
        AuthenticateWithSessionCookieFailureReason.NO_SESSION_COOKIE_PROVIDED
    ) {
      return res.redirect("/auth/login");
    }

    try {
      // If the session is invalid (i.e. the access token has expired)
      // attempt to re-authenticate with the refresh token
      const refreshResponse =
        await workos.userManagement.refreshAndSealSessionData({
          sessionData: req.cookies["wos-session"],
          cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
        });

      if (!refreshResponse.authenticated) {
        return res.redirect("/login");
      }

      // Update the cookie
      res.cookie("wos-session", refreshResponse.sealedSession, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      return next();
    } catch (e) {
      // Failed to refresh access token, redirect user to login page
      // after deleting the cookie
      res.clearCookie("wos-session");
      return res.redirect("/login");
    }
  });

  app.get("/auth/login", (req, res) => {
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      // Specify that we'd like AuthKit to handle the authentication flow
      provider: "authkit",

      // The callback endpoint that WorkOS will redirect to after a user authenticates
      redirectUri: `${req.protocol}://${req.get("host")}/auth/callback`,
      clientId: workos.clientId!,
    });

    // Redirect the user to the AuthKit sign-in page
    res.redirect(authorizationUrl);
  });

  app.get("/auth/callback", async (req, res) => {
    // The authorization code returned by AuthKit
    const code = req.query.code?.toString();

    console.log("callback", { code });

    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      const authenticateResponse =
        await workos.userManagement.authenticateWithCode({
          clientId: config.clientId,
          code,
          session: {
            sealSession: true,
            cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
          },
        });

      const { user, sealedSession } = authenticateResponse;
      console.log("authenticated", { user, sealedSession });

      // Store the session in a cookie
      res.cookie("wos-session", sealedSession, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      // Use the information in `user` for further business logic.

      // Redirect the user to the homepage
      return res.redirect("/");
    } catch (error) {
      console.error(error);
      return res.redirect("/auth/login");
    }
  });
}
