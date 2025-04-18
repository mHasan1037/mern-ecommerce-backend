const setTokenCookies = (
    res,
    accessToken,
    refreshToken,
    newAccessTokenExp,
    newRefreshTokenExp
) => {
    const accessTokenMaxAge = (newAccessTokenExp - Math.floor(Date.now() / 1000)) * 1000;
    const refreshTokenMaxAge = (newRefreshTokenExp - Math.floor(Date.now() / 1000)) * 1000;

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: accessTokenMaxAge,
        sameSite: 'lax',
    })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: refreshTokenMaxAge,
        sameSite: 'lax'
    })

    res.cookie('accessToken_public', accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: accessTokenMaxAge,
        sameSite: "lax",
    })
}

export default setTokenCookies;