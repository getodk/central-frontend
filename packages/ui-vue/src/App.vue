<script setup lang="ts">
import { ref } from 'vue';
import OdkForm from './components/OdkForm.vue';

const xform = ref('');

xform.value = `<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
<h:head>
    <h:title>Simple</h:title>
    <model>
        <instance>
            <data id="simple">
                <meta>
                    <instanceID/>
                </meta>
                <first_name/>
                <last_name/>
            </data>
        </instance>
        <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
        <bind nodeset="/data/first_name" type="string"/>
        <bind nodeset="/data/last_name" type="string" relevant="//first_name = 'sadiq'"/>
    </model>
</h:head>
<h:body>
    <input ref="/data/first_name">
        <label>First Name</label>
    </input>
    <input ref="/data/last_name">
        <label>Last Name</label>
    </input>
</h:body>
</h:html>`;
</script>

<template>
	<OdkForm :xform="xform" />
</template>

<style scoped></style>
