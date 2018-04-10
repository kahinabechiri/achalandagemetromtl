export default {
  name: 'Footer',
  data() {
    return {
      authors: [
        {
          firstName: 'Kahina',
          lastName: 'Bechiri'
        },
        {
          firstName: 'Jean-Philippe',
          lastName: 'Corbeil'
        }
      ],
      creationYear: 2018
    }
  },
  methods: {
    formatAuthors() {
      var copyRights = this.authors.map(item => item['firstName'] + ' ' + item['lastName'])

      return copyRights.join(' & ')
    }
  }
}
