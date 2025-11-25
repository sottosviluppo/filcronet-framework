<script setup lang="ts">
import { useAuth } from '@sottosviluppo/auth-frontend';

const { user, logout } = useAuth();
</script>

<template>
    <div>
        <p>Welcome, {{ user?.email }}</p>
        <button @click="logout">Logout</button>
    </div>
</template>