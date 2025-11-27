<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { rotaService } from '@/service/api.service';

const toast = useToast();
const loading = ref(false);
const generating = ref(false);
const weekRota = ref(null);
const selectedDate = ref(getNextSunday());

// Get next Sunday from today (for initial load)
function getNextSunday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // If today is Sunday, use today. Otherwise, go to next Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  return nextSunday;
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

const weekStartStr = computed(() => formatDate(selectedDate.value));

onMounted(() => {
  loadRota();
});

const loadRota = async () => {
  loading.value = true;
  try {
    weekRota.value = await rotaService.getWeekRota(weekStartStr.value);
  } catch (error) {
    weekRota.value = null;
    console.error('Error loading rota:', error);
    if (error.response?.status !== 404) {
      const errorMsg = error.userMessage || error.message || 'Failed to load rota';
      toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
  } finally {
    loading.value = false;
  }
};

// Ensure date is a Sunday - finds the Sunday that starts the week containing this date
// If the date is in the current week (Mon-Sat), it goes back to Sunday of this week
// This allows users to generate for the current week or select any date in a future week
const ensureSunday = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  // If not Sunday, go back to the Sunday that starts this week
  if (dayOfWeek !== 0) {
    d.setDate(d.getDate() - dayOfWeek);
  }
  return d;
};

const generateRota = async () => {
  // Ensure we're using a Sunday
  const sunday = ensureSunday(selectedDate.value);
  selectedDate.value = sunday;
  const sundayStr = formatDate(sunday);
  
  generating.value = true;
  try {
    await rotaService.generateWeekRota(sundayStr);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Rota generated successfully', life: 3000 });
    loadRota();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to generate rota', life: 3000 });
  } finally {
    generating.value = false;
  }
};

const downloadPdf = async () => {
  try {
    await rotaService.downloadWeekRotaPdf(weekStartStr.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'PDF downloaded', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to download PDF', life: 3000 });
  }
};

const downloadDocx = async () => {
  try {
    await rotaService.downloadWeekRotaDocx(weekStartStr.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'DOCX downloaded', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.userMessage || 'Failed to download DOCX', life: 3000 });
  }
};

const onDateChange = () => {
  // Adjust to nearest Sunday
  selectedDate.value = ensureSunday(selectedDate.value);
  loadRota();
};

const prevWeek = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() - 7);
  selectedDate.value = date;
  loadRota();
};

const nextWeek = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + 7);
  selectedDate.value = date;
  loadRota();
};

const getOfficersOnDuty = (officers) => {
  if (!officers || !Array.isArray(officers)) return [];
  return officers.filter(o => o && o.status === 'on_duty');
};

const getOfficersOffDuty = (officers) => {
  if (!officers || !Array.isArray(officers)) return [];
  return officers.filter(o => o && o.status === 'off_duty');
};
</script>

<template>
  <div class="card">
    <Toast />
    
    <Toolbar class="mb-4">
      <template #start>
        <h4 class="m-0">Weekly Duty Rota</h4>
      </template>
      <template #center>
        <div class="flex align-items-center gap-2">
          <Button icon="pi pi-chevron-left" text rounded @click="prevWeek" />
          <Calendar v-model="selectedDate" dateFormat="dd/mm/yy" @date-select="onDateChange" 
            :showIcon="true" style="width: 180px" />
          <Button icon="pi pi-chevron-right" text rounded @click="nextWeek" />
        </div>
      </template>
      <template #end>
        <Button v-if="!weekRota" label="Generate Rota" icon="pi pi-cog" 
          :loading="generating" @click="generateRota" class="mr-2" />
        <Button v-if="weekRota" label="Download PDF" icon="pi pi-file-pdf" 
          severity="secondary" @click="downloadPdf" class="mr-2" />
        <Button v-if="weekRota" label="Download DOCX" icon="pi pi-file-word" 
          severity="secondary" @click="downloadDocx" />
      </template>
    </Toolbar>

    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="!weekRota" class="text-center p-5">
      <i class="pi pi-calendar-times" style="font-size: 4rem; color: var(--surface-400)"></i>
      <p class="text-xl mt-3">No rota found for this week</p>
      <p class="text-color-secondary">Click "Generate Rota" to create the schedule</p>
    </div>

    <div v-else>
      <div class="flex justify-content-between mb-3">
        <div>
          <Tag :value="`Day Shift: Team ${weekRota.day_shift_team === 1 ? 'A' : 'B'}`" severity="warning" class="mr-2" />
          <Tag :value="`Night Shift: Team ${weekRota.night_shift_team === 1 ? 'A' : 'B'}`" severity="info" />
        </div>
        <span class="text-color-secondary">{{ weekRota.week_start }} to {{ weekRota.week_end }}</span>
      </div>

      <div class="rota-table-container">
        <table class="rota-table">
          <thead>
            <tr>
              <th class="shift-type-col">SHIFT TYPE</th>
              <th v-for="day in weekRota.days" :key="day.date" class="day-col">
                <div class="day-name">{{ (day.day_of_week || '').toUpperCase() }}</div>
                <div class="day-date">{{ day.date ? day.date.split('-').reverse().join('/') : '' }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="day-shift-row">
              <td class="shift-label">DAY SHIFT</td>
              <td v-for="day in weekRota.days" :key="day.date + '-day'">
                <div v-for="officer in getOfficersOnDuty(day.day_shift)" :key="officer.name" class="officer-name">
                  {{ (officer.name || '').toUpperCase() }}
                </div>
              </td>
            </tr>
            <tr class="night-shift-row">
              <td class="shift-label">NIGHT SHIFT</td>
              <td v-for="day in weekRota.days" :key="day.date + '-night'">
                <div v-for="officer in getOfficersOnDuty(day.night_shift)" :key="officer.name" class="officer-name">
                  {{ (officer.name || '').toUpperCase() }}
                </div>
              </td>
            </tr>
            <tr class="off-duty-row">
              <td class="shift-label">DAY-OFF</td>
              <td v-for="day in weekRota.days" :key="day.date + '-off'">
                <div v-for="officer in [...getOfficersOffDuty(day.day_shift || []), ...getOfficersOffDuty(day.night_shift || [])]" 
                  :key="officer.name" class="officer-name off-duty">
                  {{ (officer.name || '').toUpperCase() }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rota-table-container {
  overflow-x: auto;
}

.rota-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.rota-table th,
.rota-table td {
  border: 1px solid var(--surface-300);
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

.rota-table th {
  background: var(--surface-200);
  text-align: center;
}

.shift-type-col {
  width: 100px;
  min-width: 100px;
}

.day-col {
  min-width: 110px;
}

.day-name {
  font-weight: bold;
  font-size: 0.8rem;
}

.day-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.shift-label {
  font-weight: bold;
  text-align: center;
  background: var(--surface-100);
}

.day-shift-row td {
  background: rgba(255, 235, 59, 0.1);
}

.night-shift-row td {
  background: rgba(33, 150, 243, 0.1);
}

.off-duty-row td {
  background: rgba(158, 158, 158, 0.1);
}

.officer-name {
  padding: 2px 0;
  font-size: 0.8rem;
}

.officer-name.off-duty {
  color: var(--text-color-secondary);
}
</style>

