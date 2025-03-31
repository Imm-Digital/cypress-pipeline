describe("Validação de requests do Google Tag Manager e Google Analytics", () => {
  let utms,
    formfields,
    domain,
    vlsId_a,
    vlsId_b,
    pitch_a,
    pitch_b,
    checkout_a,
    checkout_b;

  before(() => {
    cy.fixture("cypress.env.testab.json").then((env) => {
      Cypress.env(env);
      utms =
        "?utm_source=GoogleAds&utm_medium=21447195831&utm_campaign=167489459667&utm_content=g&utm_term=profissional+de+transcricao&gad_source=1&gclid=CjwKCAiA5Ka9BhB5EiwA1ZVtvJS9Wm-DY1bQmylo1ioqc5T3iCi6BeAPuFYJhO4dKvTLz4xA5u7oexoCAq4QAvD_BwE&impulse_id=";
      formfields =
        "&name=John&email=test%40gmail.com&phone=9999999999&full_name=John+Doe";
      domain = Cypress.env("DOMINIO_PROJETO");
      vlsId_a = Cypress.env("VSL_ID_A");
      vlsId_b = Cypress.env("VSL_ID_B");
      pitch_a = Cypress.env("VSL_PITCH_A");
      pitch_b = Cypress.env("VSL_PITCH_B");
      checkout_a = Cypress.env("CHECKOUT_LINK_A") + "?";
      checkout_b = Cypress.env("CHECKOUT_LINK_B") + "?";
    });
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
    cy.visit(domain + utms);
  });

  it("Verifica se GTM E GA carregaram", () => {
    cy.wait("@gtm").its("response.statusCode").should("eq", 200);
    cy.wait("@gtag").its("response.statusCode").should("eq", 200);
  });

  it("Verifica se o Impulse ID foi salvo no Local Storage", () => {
    cy.wait(2000);

    cy.window().then((win) => {
      const impulseId = win.localStorage.getItem("impulse_id");
      expect(impulseId).to.not.be.null; // Verifica se o impulseId não é nulo
    });
  });

  it("Verifica se 'variant' A/B foi salvo no Local Storage", () => {
    cy.window().then((win) => {
      const variant = win.localStorage.getItem("variant");
      expect(variant).to.not.be.null;
      win.localStorage.removeItem("variant");
    });
  });

  it("Verifica a passagem de UTMs P1A > P2A > PVA > Checkout e Fields Forms P2A > PVA > Checkout", () => {
    cy.window().then((win) => {
      win.localStorage.setItem("variant", "a");
      return;
    });
    cy.reload();

    cy.window().then((win) => {
      win.localStorage.setItem(vlsId_a, pitch_a.toString());
      const impulseId = win.localStorage.getItem("impulse_id");
      cy.wrap(impulseId).as("impulseId");
      return;
    });

    cy.get("button").first().should("be.visible").click(); // ALTERAR, DEPENDENDO DA CATEGORIA DO FUNIL

    cy.wait(1000);

    cy.get("@impulseId").then((impulseId) => {
      cy.url().should("include", domain + "p2a" + utms + impulseId);
    });

    cy.get("select").first().select(2);
    cy.get("select").eq(1).select(1);
    cy.get("select").eq(2).select(1);

    // Type into the input fields
    cy.get("input").first().type("test");
    cy.get("select").eq(3).select(1);
    cy.get("select").eq(4).select(1);
    cy.get("input").eq(1).type("John Doe");
    cy.get("input").eq(2).type("test@gmail.com");
    cy.get("input").eq(3).type("9999999999");

    cy.get("button").first().click();

    cy.get("@impulseId").then((impulseId) => {
      cy.url().should(
        "include",
        domain + "pva" + utms + impulseId + formfields
      );
    });
    cy.wait(1000);

    cy.get(".smartplayer-resume__play > .smartplayer-resume__icon")
      .should("be.visible")
      .click();

    cy.wait(2000);

    cy.get(`a[href*="${checkout_a}"]`)
      .should("be.visible")
      .then(($link) => {
        cy.visit($link.attr("href")); // Visita o href do elemento
      });

    cy.get("@impulseId").then((impulseId) => {
      cy.origin(
        new URL(checkout_a).origin,
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
  it("Verifica a passagem de UTMs P1B > P2B > PVB > Checkout e Fields Forms P2B > PVB > Checkout", () => {
    cy.window().then((win) => {
      win.localStorage.setItem("variant", "b");
      return;
    });
    cy.reload();

    cy.window().then((win) => {
      win.localStorage.setItem(vlsId_b, pitch_b.toString());
      const impulseId = win.localStorage.getItem("impulse_id");
      cy.wrap(impulseId).as("impulseId");
      return;
    });

    cy.get("button").first().should("be.visible").click(); // ALTERAR, DEPENDENDO DA CATEGORIA DO FUNIL

    cy.wait(1000);

    cy.get("@impulseId").then((impulseId) => {
      cy.url().should("include", domain + "p2b" + utms + impulseId);
    });

    cy.get("select").first().select(2);
    cy.get("select").eq(1).select(1);
    cy.get("select").eq(2).select(1);

    // Type into the input fields
    cy.get("input").first().type("test");
    cy.get("select").eq(3).select(1);
    cy.get("select").eq(4).select(1);
    cy.get("input").eq(1).type("John Doe");
    cy.get("input").eq(2).type("test@gmail.com");
    cy.get("input").eq(3).type("9999999999");

    cy.get("button").first().click();

    cy.get("@impulseId").then((impulseId) => {
      cy.url().should(
        "include",
        domain + "pvb" + utms + impulseId + formfields
      );
    });
    cy.wait(1000);

    cy.get(".smartplayer-resume__play > .smartplayer-resume__icon")
      .should("be.visible")
      .click();

    cy.wait(2000);

    cy.get(`a[href*="${checkout_b}"]`)
      .should("be.visible")
      .then(($link) => {
        cy.visit($link.attr("href")); // Visita o href do elemento
      });

    cy.get("@impulseId").then((impulseId) => {
      cy.origin(
        new URL(checkout_b).origin,
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
