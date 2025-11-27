<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { officerService } from '@/service/api.service';

const toast = useToast();
const officers = ref([]);
const loading = ref(false);
const officerDialog = ref(false);
const deleteDialog = ref(false);
const officer = ref({});
const selectedOfficer = ref(null);
const submitted = ref(false);

const roles = [
  { label: 'Sergeant', value: 'sergeant' },
  { label: 'Female', value: 'female' },
  { label: 'Regular', value: 'regular' }
];

const teams = [
  { label: 'Team A', value: 1 },
  { label: 'Team B', value: 2 }
];

onMounted(() => {
  loadOfficers();
});

const loadOfficers = async () => {
  loading.value = true;
  try {
    officers.value = await officerService.getAll();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load officers', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const openNew = () => {
  officer.value = { name: '', role: 'regular', team: 1 };
  submitted.value = false;
  officerDialog.value = true;
};

const editOfficer = (off) => {
  officer.value = { ...off };
  officerDialog.value = true;
};

const confirmDelete = (off) => {
  selectedOfficer.value = off;
  deleteDialog.value = true;
};

const saveOfficer = async () => {
  submitted.value = true;
  
  if (!officer.value.name?.trim()) return;

  try {
    if (officer.value.id) {
      await officerService.update(officer.value.id, officer.value);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Officer updated', life: 3000 });
    } else {
      await officerService.create(officer.value);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Officer created', life: 3000 });
    }
    officerDialog.value = false;
    loadOfficers();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to save officer', life: 3000 });
  }
};

const deleteOfficer = async () => {
  try {
    await officerService.delete(selectedOfficer.value.id);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Officer deleted', life: 3000 });
    deleteDialog.value = false;
    loadOfficers();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete officer', life: 3000 });
  }
};

const getRoleLabel = (role) => {
  const found = roles.find(r => r.value === role);
  return found ? found.label : role;
};

const getTeamLabel = (team) => {
  return team === 1 ? 'Team A' : 'Team B';
};

const getRoleSeverity = (role) => {
  switch (role) {
    case 'sergeant': return 'danger';
    case 'female': return 'info';
    default: return 'success';
  }
};
</script>

<template>
  <div class="card">
    <Toast />
    
    <Toolbar class="mb-4">
      <template #start>
        <h4 class="m-0">Officers Management</h4>
      </template>
      <template #end>
        <Button label="New Officer" icon="pi pi-plus" class="mr-2" @click="openNew" />
      </template>
    </Toolbar>

    <DataTable 
      :value="officers" 
      :loading="loading"
      stripedRows
      paginator 
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
    >
      <Column field="name" header="Name" sortable />
      <Column field="role" header="Role" sortable>
        <template #body="{ data }">
          <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
        </template>
      </Column>
      <Column field="team" header="Team" sortable>
        <template #body="{ data }">
          <Tag :value="getTeamLabel(data.team)" :severity="data.team === 1 ? 'warning' : 'secondary'" />
        </template>
      </Column>
      <Column header="Actions" style="width: 150px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" class="mr-2" rounded outlined @click="editOfficer(data)" />
          <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDelete(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Officer Dialog -->
    <Dialog v-model:visible="officerDialog" header="Officer Details" :modal="true" :style="{ width: '450px' }">
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="name" class="font-bold">Name</label>
          <InputText id="name" v-model="officer.name" required autofocus 
            :class="{ 'p-invalid': submitted && !officer.name }" class="w-full" />
          <small v-if="submitted && !officer.name" class="p-error">Name is required.</small>
        </div>
        
        <div class="field">
          <label for="role" class="font-bold">Role</label>
          <Dropdown id="role" v-model="officer.role" :options="roles" 
            optionLabel="label" optionValue="value" class="w-full" />
        </div>
        
        <div class="field">
          <label for="team" class="font-bold">Team</label>
          <Dropdown id="team" v-model="officer.team" :options="teams" 
            optionLabel="label" optionValue="value" class="w-full" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="officerDialog = false" />
        <Button label="Save" icon="pi pi-check" @click="saveOfficer" />
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{ width: '400px' }">
      <div class="flex align-items-center gap-3">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500)" />
        <span>Are you sure you want to delete <b>{{ selectedOfficer?.name }}</b>?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
        <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteOfficer" />
      </template>
    </Dialog>
  </div>
</template>

