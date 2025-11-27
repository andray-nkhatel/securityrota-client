<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const store = useStore();
const router = useRouter();
const toast = useToast();

const username = ref('');
const password = ref('');
const loading = ref(false);

const login = async () => {
    if (!username.value || !password.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please enter username and password',
            closable: true,
            sticky: false
        });
        return;
    }

    loading.value = true;

    try {
        await store.dispatch('auth/login', {
            username: username.value,
            password: password.value
        });

        const queryRedirect = router.currentRoute.value.query.redirect;
        const redirectPath = queryRedirect || '/app/dashboard';

        toast.add({
            severity: 'success',
            summary: 'Login Successful',
            detail: 'You have been logged in successfully.',
            life: 1500,
            closable: true,
            sticky: false
        });

        router.push(redirectPath);
        password.value = '';
    } catch (error) {
        console.error('Login error:', error);

        if (error.isCorsError) {
            toast.add({
                severity: 'error',
                summary: 'Connection Error',
                detail: 'Cannot connect to the server. Please contact your administrator.',
                life: 5000,
                closable: true,
                sticky: true
            });
        } else if (error.response && error.response.status === 401) {
            toast.add({
                severity: 'error',
                summary: 'Login Failed',
                detail: 'Invalid credentials. Please check your username and password.',
                life: 3000,
                closable: true,
                sticky: false
            });
        } else {
            let errorMessage = 'Invalid credentials';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.add({
                severity: 'error',
                summary: 'Login Failed',
                detail: errorMessage,
                life: 3000,
                closable: true,
                sticky: false
            });
        }
        password.value = '';
    } finally {
        setTimeout(() => {
            loading.value = false;
        }, 300);
    }
};

const registerNavigation = () => {
    router.push('/auth/register');
};
</script>

<template>
    <Toast position="top-center" />
    <FloatingConfigurator />
    <div class="bg-surface-200 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center w-full">
            <div class="w-full max-w-lg py-20 px-4 sm:px-8" style="border-radius: 53px">
                <div class="text-center mb-8">
                    <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome</div>
                    <span class="text-muted-color font-medium">Sign in to continue</span>
                </div>
                <form @submit.prevent="login">
                    <div>
                        <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                        <InputText id="username" type="text" placeholder="Username" class="w-full mb-8" v-model="username" />
                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="w-full mb-4" fluid :feedback="false"></Password>
                        <div class="flex items-center justify-end mt-2 mb-8 gap-8">
                            <!-- <span @click="registerNavigation" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Register</span> -->
                        </div>
                        <Button type="submit" label="Sign In" class="w-full" :loading="loading"></Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
