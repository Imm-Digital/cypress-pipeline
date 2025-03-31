describe('Teste Básico de Website', () => {
    // Antes de cada teste
    beforeEach(() => {
      // Visita a página inicial do site
      cy.visit('https://example.com')
    })
  
    it('Verifica se a página carrega corretamente', () => {
      // Verifica se o título contém "Example Domain"
      cy.title().should('include', 'Example Domain')
      
      // Verifica se o elemento h1 existe e contém texto
      cy.get('h1').should('be.visible')
        .and('contain', 'Example Domain')
      
      // Verifica se o link está presente e tem o href correto
      cy.get('a').should('have.attr', 'href')
        .and('include', 'iana.org')
    })
  })