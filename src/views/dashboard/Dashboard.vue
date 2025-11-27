<template>
  <div class="grid grid-cols-1 gap-6">
    <Panel>
      <template #header>
        <h2 class="text-xl font-semibold">Welcome to Your Dashboard</h2>
      </template>
      <div class="text-center py-8">
        <i class="pi pi-home text-6xl text-primary mb-4"></i>
        <p class="text-lg text-surface-600 dark:text-surface-300">
          This is your application dashboard. Start building your features here.
        </p>
      </div>
    </Panel>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Panel>
        <template #header>
          <span class="font-semibold">Quick Stats</span>
        </template>
        <div class="text-center">
          <p class="text-3xl font-bold text-primary">0</p>
          <p class="text-surface-500">Items</p>
        </div>
      </Panel>

      <Panel>
        <template #header>
          <span class="font-semibold">Activity</span>
        </template>
        <div class="text-center">
          <p class="text-3xl font-bold text-primary">0</p>
          <p class="text-surface-500">Actions</p>
        </div>
      </Panel>

      <Panel>
        <template #header>
          <span class="font-semibold">Status</span>
        </template>
        <div class="text-center">
          <Tag severity="success" value="Online" />
        </div>
      </Panel>
    </div>
  </div>
</template>

<script setup>
// Add your dashboard logic here
</script>
