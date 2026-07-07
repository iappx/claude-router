<template>
  <div>
    <Toaster position="top-right" theme="dark" rich-colors />
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, VueBase } from '@i-app/vue-facing-di'
import { Toaster } from 'vue-sonner'
import { Events } from '@wailsio/runtime'

@Component({ components: { Toaster } })
export default class App extends VueBase {
    private unsubscribeUrlReceived: (() => void) | null = null

    created(): void {
        // Fires when a second claude-router.exe launch (a fresh claude://
        // click) forwards its URL here instead of opening a second window
        // (see main.go's SingleInstance.OnSecondInstanceLaunch) — jump to
        // the picker even if Dashboard is what's currently showing.
        this.unsubscribeUrlReceived = Events.On('router:url-received', () => {
            void this.$router.push('/app/router')
        })
    }

    beforeUnmount(): void {
        this.unsubscribeUrlReceived?.()
    }
}
</script>
