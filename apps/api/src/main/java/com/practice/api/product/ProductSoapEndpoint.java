package com.practice.api.product;

import com.practice.api.product.soap.v1.GetProductRequest;
import com.practice.api.product.soap.v1.GetProductResponse;
import com.practice.api.product.soap.v1.ListProductsRequest;
import com.practice.api.product.soap.v1.ListProductsResponse;
import com.practice.api.product.soap.v1.ProductType;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.ws.soap.server.endpoint.annotation.FaultCode;
import org.springframework.ws.soap.server.endpoint.annotation.SoapFault;

@Endpoint
public class ProductSoapEndpoint {

	static final String NAMESPACE = "http://practice.com/products/v1";

	private final ProductRepository repository;

	public ProductSoapEndpoint(ProductRepository repository) {
		this.repository = repository;
	}

	@PayloadRoot(namespace = NAMESPACE, localPart = "getProductRequest")
	@ResponsePayload
	public GetProductResponse getProduct(@RequestPayload GetProductRequest request) {
		Product product = repository.findById(request.getId())
			.orElseThrow(() -> new ProductNotFoundException(request.getId()));
		GetProductResponse response = new GetProductResponse();
		response.setProduct(toSoap(product));
		return response;
	}

	@PayloadRoot(namespace = NAMESPACE, localPart = "listProductsRequest")
	@ResponsePayload
	public ListProductsResponse listProducts(@RequestPayload ListProductsRequest request) {
		ListProductsResponse response = new ListProductsResponse();
		repository.findAll().forEach(product -> response.getProduct().add(toSoap(product)));
		return response;
	}

	private static ProductType toSoap(Product product) {
		ProductType type = new ProductType();
		type.setId(product.id());
		type.setName(product.name());
		type.setPrice(product.price());
		return type;
	}

	// Se traduce a <soap:Fault> con código Client (equivalente SOAP a un 4xx)
	@SoapFault(faultCode = FaultCode.CLIENT)
	static class ProductNotFoundException extends RuntimeException {

		ProductNotFoundException(long id) {
			super("Producto " + id + " no existe");
		}

	}

}
