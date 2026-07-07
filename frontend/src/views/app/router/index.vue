<template>
  <div class="min-h-screen flex flex-col p-6 space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-mono font-bold text-foreground">Route to instance</h1>
        <p class="text-xs font-mono text-muted-foreground mt-1">Choose which Claude Desktop should handle this redirect</p>
      </div>
      <auto-select-timer
        v-if="routerStore.countdown > 0"
        :seconds="routerStore.countdown"
        :total="settingsStore.autoSelectTimeoutSeconds"
      />
    </div>

    <p v-if="!routerStore.pendingUrl" class="text-xs font-mono text-muted-foreground">No pending redirect.</p>

    <template v-else>
      <pending-url-preview :url="routerStore.pendingUrl" />

      <div class="space-y-4">
        <div v-if="instanceStore.instances.length > 0" class="space-y-2">
          <h2 class="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Registered</h2>
          <router-target-card
            v-for="instance in instanceStore.instances"
            :key="instance.id"
            :label="instance.name"
            :profile-dir="instance.profileDir"
            @select="onSelect(instance.path)"
          />
        </div>

        <div v-if="instanceStore.unregisteredInstances.length > 0" class="space-y-2">
          <h2 class="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Running, unregistered</h2>
          <router-target-card
            v-for="running in instanceStore.unregisteredInstances"
            :key="running.profileDir"
            :label="titleCase(running.profileDir)"
            :profile-dir="running.profileDir"
            :registered="false"
            @select="onSelect(running.path)"
          />
        </div>

        <div class="space-y-2">
          <h2 class="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Default</h2>
          <router-target-card
            v-if="routerStore.defaultInstance"
            label="System default"
            :profile-dir="routerStore.defaultInstance.profileDir"
            :is-default="true"
            @select="onSelect('')"
          />
          <p v-else class="text-[11px] font-mono text-muted-foreground">Claude Desktop isn't installed.</p>
        </div>
      </div>

      <p v-if="routerStore.routing" class="text-xs font-mono text-muted-foreground">Routing…</p>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, VueBase } from '@i-app/vue-facing-di'
import { inject } from 'tsyringe'
import { RouterStore } from '@/store/modules/router/RouterStore'
import { InstanceStore } from '@/store/modules/instance/InstanceStore'
import { SettingsStore } from '@/store/modules/settings/SettingsStore'
import { Slugifier } from '@/domain/support/Slugifier'
import RouterTargetCard from '@/components/router/RouterTargetCard.vue'
import PendingUrlPreview from '@/components/router/PendingUrlPreview.vue'
import AutoSelectTimer from '@/components/router/AutoSelectTimer.vue'

@Component({
    components: { RouterTargetCard, PendingUrlPreview, AutoSelectTimer },
})
export default class ProtocolRouterPage extends VueBase {
    constructor(
        @inject(RouterStore) public readonly routerStore: RouterStore,
        @inject(InstanceStore) public readonly instanceStore: InstanceStore,
        @inject(SettingsStore) public readonly settingsStore: SettingsStore,
    ) {
        super()
    }

    async created(): Promise<void> {
        await this.routerStore.start()
    }

    beforeUnmount(): void {
        this.routerStore.dispose()
    }

    public titleCase(profileDir: string): string {
        return Slugifier.toTitleCase(profileDir)
    }

    public async onSelect(dataDir: string): Promise<void> {
        const ok = await this.routerStore.selectTarget(dataDir)
        if (ok) {
            await this.$router.push('/app/dashboard')
        }
    }
}
</script>
