<template>
    <div class="dataset-row">

        
        <div class="row">
            <div class="col-xs-6">
                <span class="dataset-name">{{ dataset.name }}</span>
                <span v-if="dataset.isNew" class="dataset-new">
                    <span class="icon-plus-circle"></span>
                    new!
                </span>
                
            </div>
            <div class="col-xs-6 properties-count">
                {{ inFormProperties.length }} of {{ dataset.properties.length }} properties
                <a href="javascript:void(0)" role="button" class="expand-button" @click.prevent="toggleExpanded">                
                    <span v-if="!expanded" class="icon-chevron-right"></span>
                    <span v-else class="icon-chevron-down"></span>                
                </a>
            </div>
        </div>
        <div v-show="expanded" class="row property-list">
            <div class="col-xs-12">
                <span v-for="(property,index) in inFormProperties">
                    <span>{{ property.name }}</span>
                    <span v-if="property.isNew" class="icon-plus-circle property-new"></span>
                    <span v-if="index < inFormProperties.length - 1">, </span>
                </span>
            </div>
        </div>
</div>
</template>

<script>

export default {
    name: 'Row',
    props: {
        dataset: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            expanded: false
        };
    },
    computed:{
        newProperties() {
            return this.dataset.properties.filter(p => p.isNew)
        },
        inFormProperties() {
            return this.dataset.properties.filter(p => p.inForm)
        }
    },
    methods: {
        toggleExpanded() {
        this.expanded = !this.expanded;
        }
    }
}

</script>

<style lang="scss">
@import '../../assets/scss/_variables.scss';

.dataset-row {
    max-width: 77ch;
    .dataset-name {
        font-weight: bold;
        font-size: 18px;
    }
    .dataset-new {
        vertical-align: super;    
        color: $color-success;
        margin-left: 2px;
    }

    .property-new {
        margin-left: 2px;
        color: $color-success;    
        vertical-align: super;    
    }

    .properties-count {
        line-height: 28px;
    }
    a {
        color: #666;

        &:focus {
            background-color: inherit;
        }
    }
}

</style>