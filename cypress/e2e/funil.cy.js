describe("Validação de requests do Google Tag Manager e Google Analytics", () => {
  let utms, formfields, vlsId, pitch, checkout;

  before(() => {
    utms =
      "?utm_source=GoogleAds&utm_medium=21447195831&utm_campaign=167489459667&utm_content=g&utm_term=profissional+de+transcricao&gad_source=1&gclid=CjwKCAiA5Ka9BhB5EiwA1ZVtvJS9Wm-DY1bQmylo1ioqc5T3iCi6BeAPuFYJhO4dKvTLz4xA5u7oexoCAq4QAvD_BwE&impulse_id=";
    formfields =
      "&name=John&email=test%40gmail.com&phone=9999999999&full_name=John+Doe";
  
    vlsId = Cypress.env("VSL_ID");
    pitch = Cypress.env("VSL_PITCH");
    checkout = Cypress.env("CHECKOUT_LINK");
  });

  beforeEach(() => {
    cy.intercept(
      "GET",
      "https://www.googletagmanager.com/gtm.js?id=GTM-W9BLVRXK"
    ).as("gtm");
    cy.intercept(
      "GET",
      "https://www.googletagmanager.com/gtag/js?id=G-65XLVDHJC2"
    ).as("gtag");
    cy.visit("/" + utms); // <-- Agora usando caminho relativo
  });

  it("Verifica se GTM e GA carregaram", () => {
    cy.wait("@gtm").its("response.statusCode").should("eq", 200);
    cy.wait("@gtag").its("response.statusCode").should("eq", 200);
  });

  it("Verifica se o Impulse ID foi salvo no Local Storage", () => {
    cy.wait(2000);
    cy.window().then((win) => {
      const impulseId = win.localStorage.getItem("impulse_id");
      expect(impulseId).to.not.be.null;
    });
  });

  it("Verifica a passagem de UTMs e form fields entre as etapas", () => {
    cy.get("button").first().should("be.visible").click(); // ← ajuste se necessário

    cy.wait(2000);

    cy.window().then((win) => {
      win.localStorage.setItem(vlsId, pitch.toString());
      const impulseId = win.localStorage.getItem("impulse_id");
      cy.wrap(impulseId).as("impulseId");
    });

    cy.get("@impulseId").then((impulseId) => {
      cy.url().should("include", "/p2" + utms + impulseId);
    });

    cy.get("select").first().select(2);
    cy.get("select").eq(1).select(1);
    cy.get("select").eq(2).select(1);

    cy.get("input").first().type("test");
    cy.get("select").eq(3).select(1);
    cy.get("select").eq(4).select(1);
    cy.get("input").eq(1).type("test@gmail.com");
    cy.get("input").eq(2).type("John Doe");
    cy.get("input").eq(3).type("9999999999");

    cy.get("button").first().click();

    cy.get("@impulseId").then((impulseId) => {
      cy.url().should("include", "/pv" + utms + impulseId + formfields);
    });

    cy.wait(2000);

    cy.get(".smartplayer-resume__play > .smartplayer-resume__icon")
      .should("be.visible")
      .click();

    cy.wait(4000);

    cy.get(`a[href*="${checkout}"]`)
      .should("be.visible")
      .then(($link) => {
        cy.visit($link.attr("href")); // ← visita o link de checkout externo
      });

    cy.get("@impulseId").then((impulseId) => {
      cy.origin(
        new URL(checkout).origin,
        { args: { utms, impulseId, formfields } },
        ({ utms, impulseId, formfields }) => {
          cy.url().should(
            "include",
            "/checkout" + utms + impulseId + formfields
          );
        }
      );
    });
  });
});
