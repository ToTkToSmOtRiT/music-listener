<template>
    <footer class="footer">
        <span class="footer__logo">Music Listener</span>
        <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Help</a></li>
            <li><a href="#">Privacy</a></li>
        </ul>
        <small>Made for people who love to listen and to talk about it.</small>
    </footer>
</template>

<style lang="scss">
.footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    margin-top: clamp(50px, 8vw, 120px);
    padding: 36px 16px 44px;
    border-top: 1px solid var(--line);
    color: var(--text-2);

    &__logo {
        font-family: 'Aboreto', var(--font-display);
        font-size: 18px;
        letter-spacing: 0.06em;
        color: var(--text);
    }

    ul {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px 28px;
    }

    a {
        font-size: 14px;
        text-decoration: none;

        &:hover {
            color: var(--text);
        }
    }

    small {
        font-size: 13px;
        color: var(--text-3);
    }
}
</style>
