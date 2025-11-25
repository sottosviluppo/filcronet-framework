<script setup lang="ts">
import { useAuth } from '@sottosviluppo/auth-frontend';

const { user, logout } = useAuth();
</script>

<template>
    <div class="w-[50%] h-[50%]">
        <div>
            <p>Welcome, {{ user?.email }}</p>
            <Button @click="logout">Logout</Button>
        </div>
    </div>
</template>