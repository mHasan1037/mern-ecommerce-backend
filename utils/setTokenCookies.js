const setTokenCookies = (
    res,
    accessToken,
    refreshToken,
    newAccessTokenExp,
    newRefreshTokenExp
) => {
    const accessTokenMaxAge = (newAccessTokenExp - Math.floor(Date.now() / 1000)) * 1000;
    const refreshTokenMaxAge = (newRefreshTokenExp - Math.floor(Date.now() / 1000)) * 1000;
    const isProd = process.env.NODE_ENV === "production";

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: accessTokenMaxAge,
        sameSite: isProd ? "none" : "lax",
    })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: refreshTokenMaxAge,
        sameSite: isProd ? "none" : "lax",
    })

    res.cookie('accessToken_public', accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: accessTokenMaxAge,
        sameSite: isProd ? "none" : "lax",
    })
}

export default setTokenCookies;