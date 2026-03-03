export default {
  providers: [
    {
      type: "customJwt",
      issuer: "privy.io",
      applicationID: process.env.PRIVY_APP_ID,
      jwks: `https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`,
      algorithm: "ES256",
    },
  ],
}
