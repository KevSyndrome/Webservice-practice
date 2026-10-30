package com.practice.api.product;

import com.practice.api.product.grpc.v1.CreateProductRequest;
import com.practice.api.product.grpc.v1.GetProductRequest;
import com.practice.api.product.grpc.v1.ListProductsRequest;
import com.practice.api.product.grpc.v1.ListProductsResponse;
import com.practice.api.product.grpc.v1.ProductServiceGrpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;

import org.springframework.stereotype.Service;

@Service
public class ProductGrpcService extends ProductServiceGrpc.ProductServiceImplBase {

	private final ProductRepository repository;

	public ProductGrpcService(ProductRepository repository) {
		this.repository = repository;
	}

	@Override
	public void listProducts(ListProductsRequest request, StreamObserver<ListProductsResponse> responses) {
		ListProductsResponse.Builder response = ListProductsResponse.newBuilder();
		repository.findAll().forEach(product -> response.addProducts(toGrpc(product)));
		responses.onNext(response.build());
		responses.onCompleted();
	}

	@Override
	public void getProduct(GetProductRequest request,
			StreamObserver<com.practice.api.product.grpc.v1.Product> responses) {
		repository.findById(request.getId()).ifPresentOrElse(product -> {
			responses.onNext(toGrpc(product));
			responses.onCompleted();
		}, () -> responses.onError(
				Status.NOT_FOUND.withDescription("Producto " + request.getId() + " no existe").asRuntimeException()));
	}

	@Override
	public void createProduct(CreateProductRequest request,
			StreamObserver<com.practice.api.product.grpc.v1.Product> responses) {
		try {
			Product product = repository.save(ProductRules.name(request.getName()),
					ProductRules.price(request.getPrice()));
			responses.onNext(toGrpc(product));
			responses.onCompleted();
		}
		catch (IllegalArgumentException e) {
			responses.onError(Status.INVALID_ARGUMENT.withDescription(e.getMessage()).asRuntimeException());
		}
	}

	private static com.practice.api.product.grpc.v1.Product toGrpc(Product product) {
		return com.practice.api.product.grpc.v1.Product.newBuilder()
			.setId(product.id())
			.setName(product.name())
			.setPrice(product.price().toPlainString())
			.build();
	}

}
