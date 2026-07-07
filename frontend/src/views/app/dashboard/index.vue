<template>
  <div class="min-h-screen flex flex-col p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-mono font-bold text-foreground">Claude Router</h1>
        <p class="text-xs font-mono text-muted-foreground mt-1">Isolated Claude Desktop instances</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="h-8 w-8 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center transition-colors hover:bg-accent/60"
          aria-label="Settings"
          @click="settingsOpen = true"
        >
          <settings-icon class="h-3.5 w-3.5" />
        </button>
        <button
          v-if="instanceStore.instances.length > 0"
          class="h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 font-mono transition-colors hover:bg-primary/90"
          @click="dialogOpen = true"
        >
          <plus-icon class="h-3.5 w-3.5" /> New instance
        </button>
      </div>
    </div>

    <p v-if="instanceStore.storageError" class="text-xs font-mono text-destructive">
      {{ instanceStore.storageError }}
    </p>

    <empty-state v-if="!instanceStore.loading && instanceStore.instances.length === 0" @create="dialogOpen = true" />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <instance-card
        v-for="instance in instanceStore.instances"
        :key="instance.id"
        :instance="instance"
        :running="instanceStore.isRunning(instance.profileDir)"
        @launch="onLaunch"
        @stop="onStop"
        @edit="onEdit"
        @open-folder="onOpenFolder"
        @remove="onRemove"
      />
    </div>

    <div v-if="instanceStore.unregisteredInstances.length > 0" class="space-y-3">
      <div>
        <h2 class="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Other running instances</h2>
        <p class="text-[11px] font-mono text-muted-foreground mt-0.5">
          Running Claude Desktop processes not managed by Claude Router yet.
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <discovered-instance-card
          v-for="running in instanceStore.unregisteredInstances"
          :key="running.profileDir"
          :profile-dir="running.profileDir"
          :name="titleCase(running.profileDir)"
          :is-default="running.isDefault"
          @stop="onStopDiscovered"
          @open-folder="onOpenFolderDiscovered"
          @register="onRegister"
        />
      </div>
    </div>

    <add-instance-dialog :open="dialogOpen" @close="dialogOpen = false" @create="onCreate" />

    <edit-instance-dialog :open="editOpen" :instance="editingInstance" @close="editOpen = false" @save="onSaveEdit" />

    <settings-dialog :open="settingsOpen" @close="settingsOpen = false" />

    <remove-instance-dialog
      :open="pendingRemove !== null"
      :instance="pendingRemove"
      @confirm="onConfirmRemove"
      @cancel="pendingRemove = null"
    />

    <register-instance-dialog :open="registerOpen" :profile-dir="registerTarget" @close="registerOpen = false" />
  </div>
</template>

<script lang="ts">
import { Component, VueBase } from '@i-app/vue-facing-di'
import { inject } from 'tsyringe'
import { Plus, Settings } from 'lucide-vue-next'
import { InstanceStore } from '@/store/modules/instance/InstanceStore'
import type { InstanceModel } from '@/domain/models/instance'
import InstanceCard from '@/components/instances/InstanceCard.vue'
import DiscoveredInstanceCard from '@/components/instances/DiscoveredInstanceCard.vue'
import AddInstanceDialog from '@/components/instances/AddInstanceDialog.vue'
import EditInstanceDialog from '@/components/instances/EditInstanceDialog.vue'
import EmptyState from '@/components/instances/EmptyState.vue'
import RemoveInstanceDialog from '@/components/instances/RemoveInstanceDialog.vue'
import RegisterInstanceDialog from '@/components/instances/RegisterInstanceDialog.vue'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import { Slugifier } from '@/domain/support/Slugifier'

@Component({
    components: {
        InstanceCard,
        DiscoveredInstanceCard,
        AddInstanceDialog,
        EditInstanceDialog,
        EmptyState,
        RemoveInstanceDialog,
        RegisterInstanceDialog,
        SettingsDialog,
        PlusIcon: Plus,
        SettingsIcon: Settings,
    },
})
export default class DashboardPage extends VueBase {
    public dialogOpen = false
    public editOpen = false
    public settingsOpen = false
    public registerOpen = false
    public editingInstance: InstanceModel | null = null
    public pendingRemove: InstanceModel | null = null
    public registerTarget: string | null = null

    constructor(
        @inject(InstanceStore) public readonly instanceStore: InstanceStore,
    ) {
        super()
    }

    public onCreate(name: string, profileDir: string): void {
        this.instanceStore.addInstance(name, profileDir)
        this.dialogOpen = false
    }

    public onEdit(id: string): void {
        this.editingInstance = this.instanceStore.instances.find((i) => i.id === id) ?? null
        this.editOpen = true
    }

    public onSaveEdit(id: string, name: string): void {
        this.instanceStore.renameInstance(id, name)
        this.editOpen = false
    }

    public onRemove(id: string): void {
        this.pendingRemove = this.instanceStore.instances.find((i) => i.id === id) ?? null
    }

    public onConfirmRemove(deleteFolder: boolean): void {
        if (!this.pendingRemove) return
        this.instanceStore.removeInstance(this.pendingRemove.id, deleteFolder)
        this.pendingRemove = null
    }

    public onLaunch(id: string): void {
        this.instanceStore.requestLaunch(id)
    }

    public onStop(id: string): void {
        this.instanceStore.requestStop(id)
    }

    public onOpenFolder(id: string): void {
        this.instanceStore.requestOpenFolder(id)
    }

    public titleCase(profileDir: string): string {
        return Slugifier.toTitleCase(profileDir)
    }

    public onStopDiscovered(profileDir: string): void {
        this.instanceStore.requestStopByProfileDir(profileDir)
    }

    public onOpenFolderDiscovered(profileDir: string): void {
        this.instanceStore.requestOpenFolderByProfileDir(profileDir)
    }

    public onRegister(profileDir: string): void {
        this.registerTarget = profileDir
        this.registerOpen = true
    }
}
</script>
