package com.practice.api.product;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.ws.config.annotation.WsConfigurer;
import org.springframework.ws.server.EndpointInterceptor;
import org.springframework.ws.soap.server.endpoint.interceptor.PayloadValidatingInterceptor;
import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;
import org.springframework.xml.xsd.XsdSchema;

@Configuration
public class ProductSoapConfig implements WsConfigurer {

	// Valida cada petición contra el XSD; si no cumple responde soap:Fault (Client) sin llegar al endpoint
	@Override
	public void addInterceptors(List<EndpointInterceptor> interceptors) {
		PayloadValidatingInterceptor validator = new PayloadValidatingInterceptor();
		validator.setXsdSchema(productsSchema());
		validator.setValidateRequest(true);
		validator.setValidateResponse(false);
		interceptors.add(validator);
	}

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
