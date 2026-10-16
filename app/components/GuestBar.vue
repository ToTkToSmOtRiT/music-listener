<template>
    <header class="guestbar">
        <NuxtLink to="/" class="guestbar__logo">Music Listener</NuxtLink>
        <div class="guestbar__right">
            <ThemeSwitch />
            <button type="button" class="btn btn--ghost" @click="openAuth(true)">Log in</button>
            <button type="button" class="btn btn--solid" @click="openAuth(false)">Sign up</button>
        </div>
    </header>
</template>

<style lang="scss">
// The top bar for visitors who are not logged in: there is no side menu for them,
// only the logo and the way to log in or sign up.
.guestbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px clamp(14px, 3vw, 32px);
    border-bottom: 1px solid var(--line);
    background: var(--bg);
    text-align: left;
    transition: background-color 0.25s ease, border-color 0.25s ease;

    &__logo {
        font-family: 'Aboreto', var(--font-display);
        font-size: 20px;
        letter-spacing: 0.06em;
        text-decoration: none;
        white-space: nowrap;
        color: var(--text);
    }

    &__right {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    @media (max-width: 560px) {
        &__logo {
            font-size: 16px;
        }

        &__right {
            gap: 6px;
        }

        .btn {
            padding: 6px 12px;
        }
    }
}
</style>
