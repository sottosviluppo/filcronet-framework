<script setup lang="ts">
import { useAuth, useLoginValidation } from '@sottosviluppo/auth-frontend';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { toTypedSchema } from "@vee-validate/zod";
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const { login, isLoading, error } = useAuth();
const { t } = useI18n();
const loginSchema = useLoginValidation({
    email: {
        required: t('validation.email.required'),
        invalid: t('validation.email.invalid'),
    },
    password: {
        required: t('validation.password.required'),
    },
});

const { errors, handleSubmit, defineField } = useForm({
    validationSchema: toTypedSchema(loginSchema),
});
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const onSubmit = handleSubmit(async (values) => {
    try {
        await login({ email: values.email, password: values.password });
        const redirect = route.query.redirect as string;
        router.push(redirect || '/');
    } catch (e) {
        console.error('Login failed', e);
    }
});
</script>

<template>
    <form @submit.prevent="onSubmit" class="form-container">
        <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {{ error }}
        </div>
        <div>
            <label for="email" class="block mb-3 font-bold">{{
                $t("login.email")
                }}</label>
            <IconField>
                <InputIcon class="pi pi-envelope" />
                <InputText id="email" autocomplete="off" :placeholder="$t('login.email')" type="email"
                    v-model.trim="email" v-bind="emailAttrs" fluid />
            </IconField>
            <div class="font-bold text-red-600">{{ errors.email }}</div>
        </div>
        <div>
            <label for="description" class="block mb-3 font-bold">{{
                $t("login.password")
                }}</label>
            <IconField>
                <InputIcon class="pi pi-key" />
                <Password id="password" type="password" :placeholder="$t('login.password')" v-model="password"
                    v-bind="passwordAttrs" toggle-mask :feedback="true" autocomplete="off" fluid />
            </IconField>
            <div v-if="errors.password" class="font-bold text-red-600">
                {{ errors.password }}
            </div>
        </div>
        <Button :disabled="isLoading" type="submit" severity="secondary" :label="isLoading ? 'Loading...' : 'Login'" />
    </form>
</template>