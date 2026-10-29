package com.practice.api.product;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;
import org.springframework.xml.xsd.XsdSchema;

@Configuration
public class ProductSoapConfig {

	// El nombre del bean define la URL del WSDL: /ws/products.wsdl
	@Bean(name = "products")
	public DefaultWsdl11Definition productsWsdl(XsdSchema productsSchema) {
		DefaultWsdl11Definition wsdl = new DefaultWsdl11Definition();
		wsdl.setPortTypeName("ProductsPort");
		wsdl.setLocationUri("/ws");
		wsdl.setTargetNamespace(ProductSoapEndpoint.NAMESPACE);
		wsdl.setSchema(productsSchema);
		return wsdl;
	}

	@Bean
	public XsdSchema productsSchema() {
		return new SimpleXsdSchema(new ClassPathResource("xsd/products.xsd"));
	}

}
