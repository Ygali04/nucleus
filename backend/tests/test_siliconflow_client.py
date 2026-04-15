"""Tests for SiliconFlowClient using httpx.MockTransport."""

from __future__ import annotations

import json

import httpx
import pytest

from nucleus.clients.siliconflow import SiliconFlowClient, SiliconFlowError


def _make_transport(handler):
    return httpx.MockTransport(handler)


@pytest.mark.asyncio
async def test_text_to_image_hits_correct_url_and_auth():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["auth"] = request.headers.get("authorization")
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"data": [{"url": "https://img/1.png"}]})

    async with SiliconFlowClient(
        api_key="test-key", transport=_make_transport(handler)
    ) as client:
        urls = await client.text_to_image("a red fox", width=512, height=512)

    assert urls == ["https://img/1.png"]
    assert captured["url"].endswith("/images/generations")
    assert captured["auth"] == "Bearer test-key"
    assert captured["body"]["prompt"] == "a red fox"
    assert captured["body"]["image_size"] == "512x512"


@pytest.mark.asyncio
async def test_text_to_image_supports_images_shape():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"images": [{"url": "https://img/alt.png"}]})

    async with SiliconFlowClient(
        api_key="k", transport=_make_transport(handler)
    ) as client:
        urls = await client.text_to_image("x")

    assert urls == ["https://img/alt.png"]


@pytest.mark.asyncio
async def test_image_to_image_hits_edits_endpoint():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"data": [{"url": "https://img/edit.png"}]})

    async with SiliconFlowClient(
        api_key="k", transport=_make_transport(handler)
    ) as client:
        url = await client.image_to_image(
            "edit prompt", reference_image_url="https://ref", strength=0.5
        )

    assert url == "https://img/edit.png"
    assert captured["url"].endswith("/images/edits")
    assert captured["body"]["image"] == "https://ref"
    assert captured["body"]["strength"] == 0.5


@pytest.mark.asyncio
async def test_error_wraps_http_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="upstream down")

    async with SiliconFlowClient(
        api_key="k", transport=_make_transport(handler)
    ) as client:
        with pytest.raises(SiliconFlowError) as excinfo:
            await client.text_to_image("x")
    assert "500" in str(excinfo.value)


@pytest.mark.asyncio
async def test_error_on_missing_urls_in_response():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": []})

    async with SiliconFlowClient(
        api_key="k", transport=_make_transport(handler)
    ) as client:
        with pytest.raises(SiliconFlowError):
            await client.text_to_image("x")


@pytest.mark.asyncio
async def test_error_on_non_json():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="not-json")

    async with SiliconFlowClient(
        api_key="k", transport=_make_transport(handler)
    ) as client:
        with pytest.raises(SiliconFlowError):
            await client.text_to_image("x")


@pytest.mark.asyncio
async def test_image_to_image_error_on_empty_list():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"images": []})

    async with SiliconFlowClient(
        api_key="k", transport=_make_transport(handler)
    ) as client:
        with pytest.raises(SiliconFlowError):
            await client.image_to_image("x", reference_image_url="https://ref")


@pytest.mark.asyncio
async def test_api_key_from_env(monkeypatch):
    monkeypatch.setenv("SILICONFLOW_KEY", "env-key")
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["auth"] = request.headers.get("authorization")
        return httpx.Response(200, json={"data": [{"url": "https://img/1.png"}]})

    async with SiliconFlowClient(transport=_make_transport(handler)) as client:
        await client.text_to_image("x")

    assert captured["auth"] == "Bearer env-key"
