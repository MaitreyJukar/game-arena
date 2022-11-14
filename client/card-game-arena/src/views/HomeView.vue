<script setup>
</script>

<template>
  <main class="home-page">
    <h1>GAME LIST</h1>
    <ul class="game-list">
      <li><router-link to="/table-hockey">Table Hockey</router-link></li>
    </ul>
  </main>
</template>

<style scoped>
.home-page {
  padding: 16px;
}

.home-page * {
  font-family: PressStart2P;
  color: black;

}
.home-page ul.game-list {
  list-style: none;
}

.home-page .game-list li a {
  color: black;
}

.home-page .game-list li a:hover {
  color: white;
}

.home-page .game-list li:before {
  content: "🔶 ";
}
</style>