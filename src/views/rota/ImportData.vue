<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { rotaService } from '@/service/api.service';

const toast = useToast();

// Import State
const importStateDialog = ref(false);
const weekStart = ref(null);
const dayShiftTeam = ref(1);
const importingState = ref(false);

// CSV Import
const officersFile = ref(null);
const shiftsFile = ref(null);
const importingOfficers = ref(false);
const importingShifts = ref(false);

const teams = [
  { label: 'Team A', value: 1 },
  { label: 'Team B', value: 2 }
];

// Format date to YYYY-MM-DD
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

const openImportState = () => {
  weekStart.value = null;
  dayShiftTeam.value = 1;
  importStateDialog.value = true;
};

const importState = async () => {
  if (!weekStart.value) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a week start date', life: 3000 });
    return;
  }

  importingState.value = true;
  try {
    const result = await rotaService.importState(formatDate(weekStart.value), dayShiftTeam.value);
    toast.add({ severity: 'success', summary: 'Success', detail: result.message || 'State imported successfully', life: 3000 });
    importStateDialog.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to import state', life: 3000 });
  } finally {
    importingState.value = false;
  }
};

const downloadOfficersTemplate = async () => {
  try {
    await rotaService.downloadOfficersTemplate();
    toast.add({ severity: 'success', summary: 'Success', detail: 'Template downloaded', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to download template', life: 3000 });
  }
};

const downloadShiftsTemplate = async () => {
  try {
    await rotaService.downloadShiftsTemplate();
    toast.add({ severity: 'success', summary: 'Success', detail: 'Template downloaded', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to download template', life: 3000 });
  }
};

const onOfficersFileSelect = (event) => {
  officersFile.value = event.files[0];
};

const onShiftsFileSelect = (event) => {
  shiftsFile.value = event.files[0];
};

const importOfficersCSV = async () => {
  if (!officersFile.value) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a file', life: 3000 });
    return;
  }

  importingOfficers.value = true;
  try {
    const result = await rotaService.importOfficersCSV(officersFile.value);
    toast.add({ 
      severity: result.failed > 0 ? 'warn' : 'success', 
      summary: 'Import Complete', 
      detail: `Created: ${result.created}, Failed: ${result.failed}`, 
      life: 5000 
    });
    if (result.errors?.length > 0) {
      console.log('Import errors:', result.errors);
    }
    officersFile.value = null;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to import officers', life: 3000 });
  } finally {
    importingOfficers.value = false;
  }
};

const importShiftsCSV = async () => {
  if (!shiftsFile.value) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a file', life: 3000 });
    return;
  }

  importingShifts.value = true;
  try {
    const result = await rotaService.importShiftsCSV(shiftsFile.value);
    toast.add({ 
      severity: result.failed > 0 ? 'warn' : 'success', 
      summary: 'Import Complete', 
      detail: `Created: ${result.created}, Failed: ${result.failed}`, 
      life: 5000 
    });
    if (result.errors?.length > 0) {
      console.log('Import errors:', result.errors);
    }
    shiftsFile.value = null;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to import shifts', life: 3000 });
  } finally {
    importingShifts.value = false;
  }
};
</script>

<template>
  <div class="grid">
    <Toast />

    <!-- Import Current State -->
    <div class="col-12 md:col-6">
      <div class="card">
        <h5><i class="pi pi-sync mr-2"></i>Import Current Rotation State</h5>
        <p class="text-color-secondary mb-4">
          Set the current rotation state to sync with your existing manual schedule.
          This tells the system which team is currently on day shift.
        </p>
        <Button label="Set Current State" icon="pi pi-cog" @click="openImportState" />
      </div>
    </div>

    <!-- Import Officers CSV -->
    <div class="col-12 md:col-6">
      <div class="card">
        <h5><i class="pi pi-users mr-2"></i>Import Officers (CSV)</h5>
        <p class="text-color-secondary mb-3">
          Bulk import officers from a CSV file.
        </p>
        <div class="flex flex-column gap-3">
          <Button label="Download Template" icon="pi pi-download" 
            severity="secondary" outlined @click="downloadOfficersTemplate" />
          <FileUpload 
            mode="basic" 
            accept=".csv" 
            :maxFileSize="1000000"
            chooseLabel="Select CSV File"
            @select="onOfficersFileSelect"
            :auto="false"
          />
          <Button label="Import Officers" icon="pi pi-upload" 
            :loading="importingOfficers" 
            :disabled="!officersFile"
            @click="importOfficersCSV" />
        </div>
      </div>
    </div>

    <!-- Import Shifts CSV -->
    <div class="col-12 md:col-6">
      <div class="card">
        <h5><i class="pi pi-calendar mr-2"></i>Import Historical Shifts (CSV)</h5>
        <p class="text-color-secondary mb-3">
          Import historical shift data from a CSV file.
        </p>
        <div class="flex flex-column gap-3">
          <Button label="Download Template" icon="pi pi-download" 
            severity="secondary" outlined @click="downloadShiftsTemplate" />
          <FileUpload 
            mode="basic" 
            accept=".csv" 
            :maxFileSize="1000000"
            chooseLabel="Select CSV File"
            @select="onShiftsFileSelect"
            :auto="false"
          />
          <Button label="Import Shifts" icon="pi pi-upload" 
            :loading="importingShifts" 
            :disabled="!shiftsFile"
            @click="importShiftsCSV" />
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="col-12 md:col-6">
      <div class="card">
        <h5><i class="pi pi-info-circle mr-2"></i>Migration Instructions</h5>
        <ol class="line-height-3">
          <li class="mb-2">First, add all officers (via Officers page or CSV import)</li>
          <li class="mb-2">Set the current rotation state to tell the system which team is on day shift</li>
          <li class="mb-2">Optionally import historical shifts for records</li>
          <li class="mb-2">Generate future weeks using the Weekly Rota page</li>
        </ol>
      </div>
    </div>

    <!-- Import State Dialog -->
    <Dialog v-model:visible="importStateDialog" header="Set Current Rotation State" :modal="true" :style="{ width: '450px' }">
      <div class="flex flex-column gap-4">
        <div class="field">
          <label class="font-bold mb-2 block">Week Start (Sunday)</label>
          <Calendar v-model="weekStart" dateFormat="dd/mm/yy" :showIcon="true" class="w-full" 
            placeholder="Select the Sunday of the current week" />
        </div>
        
        <div class="field">
          <label class="font-bold mb-2 block">Current Day Shift Team</label>
          <Dropdown v-model="dayShiftTeam" :options="teams" 
            optionLabel="label" optionValue="value" class="w-full" />
          <small class="text-color-secondary">Which team is currently working day shifts?</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="importStateDialog = false" />
        <Button label="Import" icon="pi pi-check" :loading="importingState" @click="importState" />
      </template>
    </Dialog>
  </div>
</template>

